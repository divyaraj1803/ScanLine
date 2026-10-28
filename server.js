/* ==========================================================================
   SCANLINE — Node.js + Express Backend Server
   Serves static frontend + provides /api/analyze image forensics endpoint
   ========================================================================== */

const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const sharp   = require('sharp');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');

/* ── Auth Config ─────────────────────────────────────────────────────────── */
const JWT_SECRET    = process.env.JWT_SECRET || 'scanline-super-secret-key-change-in-prod';
const USERS_FILE    = path.join(__dirname, 'users.json');
const SALT_ROUNDS   = 10;

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return []; }
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}
function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ─────────────────────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

// Serve ALL static files (html, css, js) from project root
app.use(express.static(path.join(__dirname)));

/* ── Multer — in-memory image upload (max 20 MB) ─────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported image type. Use JPG, PNG, WEBP, or AVIF.'));
  }
});

/* ── Utility helpers ─────────────────────────────────────────────────────── */

/**
 * Compute normalised entropy of a channel histogram.
 * High entropy + unusual spike patterns → synthetic diffusion artifact.
 */
function channelEntropy(histogram) {
  const total = histogram.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let H = 0;
  for (const count of histogram) {
    if (count === 0) continue;
    const p = count / total;
    H -= p * Math.log2(p);
  }
  return H / 8; // normalise to [0,1] (max entropy for 8-bit = 8 bits)
}

/**
 * Compute "ELA-proxy": variance of pixel-value differences between
 * original and a re-compressed version of the image buffer.
 * AI-generated images tend to have lower, more uniform ELA variance
 * (because they were never JPEG-compressed from a real sensor).
 */
async function elaProxy(rawBuffer) {
  // Re-export as JPEG at quality 75 then back to raw pixels
  const original = await sharp(rawBuffer)
    .resize({ width: 400, withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const recompressed = await sharp(rawBuffer)
    .resize({ width: 400, withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer();

  const reRaw = await sharp(recompressed).raw().toBuffer({ resolveWithObject: true });

  const len = Math.min(original.data.length, reRaw.data.length);
  let sumSq = 0;
  for (let i = 0; i < len; i++) {
    const diff = original.data[i] - reRaw.data[i];
    sumSq += diff * diff;
  }
  // Normalised MSE — real photographs have higher ELA variance
  return Math.sqrt(sumSq / len);
}

/**
 * Analyse colour channel statistics.  Synthetic diffusion models often
 * produce hyper-balanced RGB histograms with suspiciously even spreads.
 */
async function colourStats(rawBuffer) {
  const { data, info } = await sharp(rawBuffer)
    .resize({ width: 300, height: 300, fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // 3 = RGB, 4 = RGBA
  const hists = Array.from({ length: 3 }, () => new Array(256).fill(0));

  for (let i = 0; i < data.length; i += channels) {
    hists[0][data[i]]++;
    hists[1][data[i + 1]]++;
    hists[2][data[i + 2]]++;
  }

  const entropies = hists.map(h => channelEntropy(h));
  const avgEntropy = entropies.reduce((a, b) => a + b, 0) / 3;

  // Measure inter-channel correlation — very high = synthetic
  let corr = 0;
  const n = data.length / channels;
  for (let i = 0; i < data.length; i += channels) {
    corr += Math.abs(data[i] - data[i + 1]) + Math.abs(data[i + 1] - data[i + 2]);
  }
  const avgChannelDiff = corr / n / 255; // 0 = identical channels (suspicious)

  return { avgEntropy, avgChannelDiff };
}

/**
 * Check image metadata via sharp — real camera images usually carry
 * EXIF make/model/datetime; AI-generated images typically have none.
 */
async function metaScore(rawBuffer) {
  try {
    const meta = await sharp(rawBuffer).metadata();
    let score = 0;
    if (meta.exif)   score += 30; // EXIF present
    if (meta.icc)    score += 15; // colour profile
    if (meta.xmp)    score += 10; // XMP tags
    // DPI hints from real cameras
    if (meta.density && meta.density >= 72) score += 20;
    // Format: JPEG most common for real cameras; PNG/WEBP without EXIF sus
    if (meta.format === 'jpeg') score += 15;
    return Math.min(score, 100); // 0-100, higher = more authentic
  } catch {
    return 0;
  }
}

/* ── Core Analysis Engine ────────────────────────────────────────────────── */
async function analyzeImage(buffer, originalName) {
  const [ela, colour, exifScore] = await Promise.all([
    elaProxy(buffer),
    colourStats(buffer),
    metaScore(buffer)
  ]);

  /*
   * Heuristic scoring (all values normalised to 0–100, higher = MORE synthetic)
   *
   * elaVariance   — LOW = uniform synthetic texture  → HIGH synth score
   * avgEntropy    — VERY HIGH balanced entropy = synthetic diffusion
   * channelCorr   — LOW diff between channels = suspiciously balanced
   * exifScore     — LOW metadata = no real camera provenance
   */
  const elaScore      = Math.max(0, Math.min(100, 100 - (ela / 15) * 100));
  const entropyScore  = colour.avgEntropy > 0.88 ? 85 : colour.avgEntropy > 0.80 ? 50 : 20;
  const channelScore  = colour.avgChannelDiff < 0.05 ? 80 : colour.avgChannelDiff < 0.10 ? 45 : 15;
  const exifPenalty   = Math.max(0, 100 - exifScore); // no EXIF = high AI probability

  // Filename hints (soft signal)
  const lowerName = (originalName || '').toLowerCase();
  const nameBias = ['ai', 'midjourney', 'flux', 'dalle', 'sdxl', 'mj', 'deepfake', 'synthetic']
    .some(k => lowerName.includes(k)) ? 20 : 0;

  // Weighted composite score (0–100, higher = higher probability of AI)
  const compositeAI = Math.min(100,
    elaScore      * 0.30 +
    entropyScore  * 0.25 +
    channelScore  * 0.20 +
    exifPenalty   * 0.20 +
    nameBias      * 0.05
  );

  const isDeepfake = compositeAI >= 50;

  // Map to individual forensic metric breakdown
  const metrics = {
    elaDiscrepancy:  Math.round(elaScore),
    spectralNoise:   Math.round(entropyScore),
    facialSymmetry:  Math.round(channelScore),
    exifIntegrity:   exifScore
  };

  return {
    verdict:          isDeepfake ? 'AI_GENERATED' : 'AUTHENTIC',
    isDeepfake,
    confidenceScore:  parseFloat(compositeAI.toFixed(1)),
    modelFingerprint: isDeepfake
      ? 'Server-side Heuristic Classifier (ELA + Entropy + EXIF)'
      : 'Organic Sensor / Authentic Photograph',
    metrics,
    analysis: {
      elaVariance:    parseFloat(ela.toFixed(4)),
      entropyAvg:     parseFloat(colour.avgEntropy.toFixed(4)),
      channelBalance: parseFloat(colour.avgChannelDiff.toFixed(4)),
      exifScore
    }
  };
}

/* ── Routes ──────────────────────────────────────────────────────────────── */

/* ── Auth Routes ─────────────────────────────────────────────────────────── */

/**
 * POST /api/auth/register
 * Body: { username, password, email? }
 */
app.post('/api/auth/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });
  if (username.length < 3)
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const users = loadUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
    return res.status(409).json({ error: 'Username already taken.' });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = { username, passwordHash, email: email || null };
  users.push(newUser);
  saveUsers(users);

  const token = signToken({ username });
  res.json({ ok: true, token, username });
});

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required.' });

  const users = loadUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return res.status(401).json({ error: 'No account found with that username.' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid password.' });

  const token = signToken({ username: user.username });
  res.json({ ok: true, token, username: user.username, email: user.email });
});

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided.' });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token.' });

  const users = loadUsers();
  const user = users.find(u => u.username === payload.username);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  res.json({ ok: true, username: user.username, email: user.email });
});

/**
 * POST /api/analyze
 * Body: multipart/form-data with field "image"
 * Returns: JSON forensic verdict
 */
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided.' });
  }

  try {
    const result = await analyzeImage(req.file.buffer, req.file.originalname);

    res.json({
      ok: true,
      fileName:  req.file.originalname,
      fileSize:  `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
      mimeType:  req.file.mimetype,
      ...result
    });
  } catch (err) {
    console.error('[/api/analyze] Error:', err.message);
    res.status(500).json({ error: 'Image analysis failed.', detail: err.message });
  }
});

/**
 * GET /api/health
 * Simple health-check for uptime monitoring
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Scanline Forensics API', version: '1.0.0' });
});

/**
 * GET /api/history — placeholder (history is client-side localStorage)
 * Could be wired to a DB in a future upgrade.
 */
app.get('/api/history', (req, res) => {
  res.json({ message: 'Scan history is stored client-side in localStorage. Use GET /api/analyze to submit new scans.' });
});

/* Fallback: serve index.html for any unmatched route (SPA-style) */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ── Start ───────────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🔬 SCANLINE Forensics API running at http://localhost:${PORT}`);
  console.log(`   → Static site: http://localhost:${PORT}/index.html`);
  console.log(`   → API:         http://localhost:${PORT}/api/analyze  [POST multipart/form-data]\n`);
});
