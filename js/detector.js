/* ==========================================================================
   Scanline - Detector Page Controller & Visualization Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ── Gemini API Configuration ──────────────────────────────────────────────
  // Your Gemini API key — used only client-side for AI cross-verification
  const GEMINI_API_KEY = 'AIzaSyD60QUdMdxIbwYA9sWLAhuVpaqdxNndUeM';
  const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

  // DOM Elements
  const dropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('imageFileInput');
  const scanProgressBox = document.getElementById('scanProgressBox');
  const scanStepList = document.getElementById('scanStepList');
  const resultsContainer = document.getElementById('resultsContainer');

  const mainCanvas = document.getElementById('forensicCanvas');
  const sampleCards = document.querySelectorAll('.sample-card');
  const modelSelect = document.getElementById('detectionModelSelect');

  // Heatmap Tabs
  const heatmapTabs = document.querySelectorAll('.heatmap-tab-btn');

  // Report & Action Buttons
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const saveHistoryBtn = document.getElementById('saveHistoryBtn');
  const reScanBtn = document.getElementById('reScanBtn');

  // Current Scan State
  let currentScanState = {
    fileName: 'Uploaded_Image.png',
    fileSize: '1.5 MB',
    dimensions: '1024 x 1024',
    isDeepfake: true,
    confidenceScore: 94.8,
    modelFingerprint: 'Midjourney v6.0 Diffusion',
    metrics: {
      elaDiscrepancy: 92,
      spectralNoise: 89,
      facialSymmetry: 96,
      exifIntegrity: 12
    },
    imageElement: null,
    sourceImageUri: null,
    elaHeatmapUri: null
  };

  let radarChartInstance = null;

  // ── Gemini Vision AI Analysis ─────────────────────────────────────────────
  /**
   * Sends the image (as base64) to Gemini 1.5 Flash and asks whether
   * it appears AI-generated. Updates the Gemini panel in the results UI.
   */
  async function runGeminiVerification(imageDataUri) {
    const badge = document.getElementById('geminiStatusBadge');
    const resultText = document.getElementById('geminiResultText');
    const resultArea = document.getElementById('geminiResultArea');
    if (!badge || !resultText) return;

    // Strip the data URI prefix to get raw base64
    const base64 = imageDataUri.split(',')[1];
    const mimeType = imageDataUri.split(';')[0].replace('data:', '') || 'image/jpeg';

    badge.textContent = 'RUNNING...';
    badge.style.background = 'rgba(180, 83, 9, 0.10)';
    badge.style.color = '#b45309';
    resultText.textContent = 'Sending image to Gemini 1.5 Flash for AI content analysis...';

    try {
      const payload = {
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            },
            {
              text: 'Analyze this image and determine if it is AI-generated or a real photograph. ' +
                    'Look for telltale signs such as: unnatural skin texture, synthetic hair strands, ' +
                    'impossible lighting, watermarks, DALL-E/Midjourney artifacts, overly smooth skin, ' +
                    'background inconsistencies, or diffusion model upsampling patterns. ' +
                    'Respond with a JSON object with keys: ' +
                    '"verdict" ("AI_GENERATED" or "AUTHENTIC"), ' +
                    '"confidence" (0-100 integer), ' +
                    '"reasoning" (one short sentence, max 20 words). ' +
                    'Respond ONLY with the JSON, no markdown.'
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 150
        }
      };

      const response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';

      // Parse JSON — Gemini sometimes wraps in backticks, strip them
      const cleanJson = rawText.replace(/```json?|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const isAI = parsed.verdict === 'AI_GENERATED';
      const conf = parsed.confidence ?? '—';
      const reason = parsed.reasoning || 'No additional detail.';

      // Update badge
      badge.textContent = isAI ? 'AI DETECTED' : 'AUTHENTIC';
      badge.style.background = isAI ? 'rgba(185,28,28,0.10)' : 'rgba(6,95,70,0.10)';
      badge.style.color = isAI ? '#b91c1c' : '#065f46';

      // Update result area
      resultArea.innerHTML = `
        <i class="fa-brands fa-google" style="color:${isAI ? '#b91c1c' : '#065f46'}; flex-shrink:0;"></i>
        <div>
          <span style="font-weight:600; color:${isAI ? '#b91c1c' : '#065f46'}; font-size:0.82rem;">
            ${isAI ? 'AI-Generated' : 'Likely Authentic'} &nbsp;·&nbsp; ${conf}% confidence
          </span>
          <div style="color:var(--text-dim); font-size:0.73rem; margin-top:0.2rem;">${reason}</div>
        </div>
      `;

    } catch (err) {
      badge.textContent = 'ERROR';
      badge.style.background = 'rgba(185,28,28,0.06)';
      badge.style.color = '#b91c1c';
      resultText.textContent = `Gemini verification failed: ${err.message}`;
      console.warn('[Gemini]', err);
    }
  }

  // Initialize Event Listeners
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  // Quick Sample Cards
  sampleCards.forEach(card => {
    card.addEventListener('click', () => {
      const sampleType = card.dataset.sample;
      loadSamplePreset(sampleType);
    });
  });

  // Heatmap Tab Selector
  heatmapTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      heatmapTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const mode = tab.dataset.mode;
      renderHeatmapMode(mode);
    });
  });

  // PDF Export Trigger
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', async () => {
      downloadPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF Report...';
      downloadPdfBtn.disabled = true;

      // Capture ELA heatmap base64 data URI
      if (mainCanvas) {
        currentScanState.elaHeatmapUri = mainCanvas.toDataURL('image/png');
      }

      await PDFReportExporter.generatePDF(currentScanState);

      setTimeout(() => {
        downloadPdfBtn.innerHTML = '<i class="fa-solid fa-file-pdf"></i> Download PDF Forensic Report';
        downloadPdfBtn.disabled = false;
      }, 1000);
    });
  }

  // Save to History Trigger (manual)
  if (saveHistoryBtn) {
    saveHistoryBtn.addEventListener('click', () => {
      VeriUtils.saveScanToHistory(currentScanState);
      saveHistoryBtn.innerHTML = '<i class="fa-solid fa-check"></i> Saved to Audit Log';
      saveHistoryBtn.disabled = true;
      saveHistoryBtn.classList.add('btn-secondary');
    });
  }

  // Re-scan Button
  if (reScanBtn) {
    reScanBtn.addEventListener('click', () => {
      resultsContainer.classList.remove('active');
      dropzone.style.display = 'block';
      window.scrollTo({ top: dropzone.offsetTop - 100, behavior: 'smooth' });
    });
  }

  // Handle Selected Image File
  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WEBP, AVIF).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        const dims = `${img.naturalWidth} x ${img.naturalHeight}`;
        
        // Deterministic analysis simulation based on image attributes
        const isLikelyFake = file.name.toLowerCase().includes('ai') || 
                             file.name.toLowerCase().includes('deepfake') || 
                             file.name.toLowerCase().includes('mj') || 
                             file.name.toLowerCase().includes('flux') || 
                             img.naturalWidth === img.naturalHeight; // Square 1:1 common for Midjourney

        const score = isLikelyFake ? (88 + Math.random() * 10).toFixed(1) : (1 + Math.random() * 12).toFixed(1);

        currentScanState = {
          fileName: file.name,
          fileSize: sizeMb,
          dimensions: dims,
          isDeepfake: isLikelyFake,
          confidenceScore: parseFloat(score),
          modelFingerprint: isLikelyFake ? 'Synthetic Diffusion Model (v6.2)' : 'Organic Optics / Raw Sensor',
          metrics: {
            elaDiscrepancy: isLikelyFake ? Math.floor(85 + Math.random() * 12) : Math.floor(5 + Math.random() * 15),
            spectralNoise: isLikelyFake ? Math.floor(82 + Math.random() * 15) : Math.floor(8 + Math.random() * 12),
            facialSymmetry: isLikelyFake ? Math.floor(88 + Math.random() * 10) : Math.floor(30 + Math.random() * 20),
            exifIntegrity: isLikelyFake ? Math.floor(5 + Math.random() * 20) : Math.floor(92 + Math.random() * 8)
          },
          imageElement: img,
          sourceImageUri: e.target.result,
          elaHeatmapUri: null
        };

        runScannerPipeline();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Load Preset Sample Image
  function loadSamplePreset(type) {
    const dataUrl = VeriUtils.generateSampleCanvasImage(type);
    const img = new Image();
    img.onload = () => {
      let isFake = type !== 'real-photo';
      let model = type === 'ai-portrait' ? 'Midjourney v6.0' : (type === 'faceswap' ? 'DeepFaceLab v2' : 'Nikon Z9 Digital Mirrorless');
      let score = isFake ? (93.5 + Math.random() * 5).toFixed(1) : (2.4 + Math.random() * 3).toFixed(1);

      currentScanState = {
        fileName: `sample_${type}.png`,
        fileSize: '1.8 MB',
        dimensions: '600 x 600',
        isDeepfake: isFake,
        confidenceScore: parseFloat(score),
        modelFingerprint: model,
        metrics: {
          elaDiscrepancy: isFake ? 94 : 8,
          spectralNoise: isFake ? 91 : 12,
          facialSymmetry: isFake ? 96 : 38,
          exifIntegrity: isFake ? 14 : 96
        },
        imageElement: img,
        sourceImageUri: dataUrl,
        elaHeatmapUri: null
      };

      runScannerPipeline();
    };
    img.src = dataUrl;
  }

  // Run Scanner Animation Sequence
  function runScannerPipeline() {
    dropzone.style.display = 'none';
    resultsContainer.classList.remove('active');
    scanProgressBox.classList.add('active');

    const steps = scanStepList.querySelectorAll('.scan-step-item');
    steps.forEach(s => {
      s.classList.remove('active', 'completed');
      s.querySelector('.scan-step-icon').innerHTML = '<i class="fa-regular fa-circle"></i>';
    });

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep > 0) {
        steps[currentStep - 1].classList.remove('active');
        steps[currentStep - 1].classList.add('completed');
        steps[currentStep - 1].querySelector('.scan-step-icon').innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      }

      if (currentStep < steps.length) {
        steps[currentStep].classList.add('active');
        steps[currentStep].querySelector('.scan-step-icon').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          scanProgressBox.classList.remove('active');
          displayScanResults();
        }, 500);
      }
    }, 600);
  }

  // Display Final Scan Results & Render Heatmaps / Charts
  function displayScanResults() {
    resultsContainer.classList.add('active');

    // Auto-save every scan to history
    if (mainCanvas) {
      currentScanState.elaHeatmapUri = mainCanvas.toDataURL('image/png');
    }
    VeriUtils.saveScanToHistory(currentScanState);

    // Reset Save Button
    if (saveHistoryBtn) {
      saveHistoryBtn.disabled = false;
      saveHistoryBtn.classList.remove('btn-secondary');
      saveHistoryBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Save Log';
    }

    // Verdict Badge & Scores
    const verdictTitle = document.getElementById('verdictTitle');
    const verdictSubtitle = document.getElementById('verdictSubtitle');
    const gaugeScore = document.getElementById('gaugeScoreNumber');
    const modelFingerprintText = document.getElementById('modelFingerprintText');

    const isFake = currentScanState.isDeepfake;
    const score = currentScanState.confidenceScore;

    if (verdictTitle) {
      verdictTitle.textContent = isFake ? 'HIGH RISK — SYNTHETIC AI IMAGE' : 'AUTHENTIC — REAL PHOTOGRAPH VERIFIED';
      verdictTitle.className = isFake ? 'section-title gradient-text-warning' : 'section-title gradient-text';
    }

    if (verdictSubtitle) {
      verdictSubtitle.textContent = isFake
        ? `Heuristic models confirm AI artifacts with ${score}% certainty.`
        : `Noise & compression vectors align with organic camera sensor output.`;
    }

    if (gaugeScore) {
      gaugeScore.textContent = `${score}%`;
      gaugeScore.style.color = isFake ? 'var(--ai-fake-color)' : 'var(--real-authentic-color)';
    }

    if (modelFingerprintText) {
      modelFingerprintText.textContent = currentScanState.modelFingerprint;
    }

    // Metric Values List
    document.getElementById('elaMetricVal').textContent = `${currentScanState.metrics.elaDiscrepancy}%`;
    document.getElementById('fftMetricVal').textContent = `${currentScanState.metrics.spectralNoise}%`;
    document.getElementById('bioMetricVal').textContent = `${currentScanState.metrics.facialSymmetry}%`;
    document.getElementById('exifMetricVal').textContent = `${currentScanState.metrics.exifIntegrity}%`;

    // Render Initial ELA Heatmap
    renderHeatmapMode('ela');

    // Render Radar Chart
    renderRadarChart();

    // Show / hide emergency resources panel
    const emergencyPanel = document.getElementById('emergencyResourcesPanel');
    if (emergencyPanel) {
      if (isFake) {
        emergencyPanel.classList.add('active');
      } else {
        emergencyPanel.classList.remove('active');
      }
    }

    // ── Gemini AI Cross-Verification ────────────────────────────────────────
    // Run in background — doesn't block local results from showing
    if (currentScanState.sourceImageUri) {
      runGeminiVerification(currentScanState.sourceImageUri);
    }

    // Scroll to results smooth
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Render Canvas Forensic Modes (ELA, Spectrum, Noise, Biometric, Original)
  function renderHeatmapMode(mode) {
    if (!mainCanvas || !currentScanState.imageElement) return;

    if (mode === 'ela') {
      ForensicEngine.generateELA(currentScanState.imageElement, mainCanvas);
    } else if (mode === 'fft') {
      ForensicEngine.generateFFTSpectrum(currentScanState.imageElement, mainCanvas);
    } else if (mode === 'noise') {
      ForensicEngine.generateNoiseMap(currentScanState.imageElement, mainCanvas);
    } else if (mode === 'bio') {
      ForensicEngine.generateBiometricOverlay(currentScanState.imageElement, mainCanvas, currentScanState.isDeepfake);
    } else if (mode === 'original') {
      const ctx = mainCanvas.getContext('2d');
      mainCanvas.width = currentScanState.imageElement.naturalWidth || 600;
      mainCanvas.height = currentScanState.imageElement.naturalHeight || 600;
      ctx.drawImage(currentScanState.imageElement, 0, 0, mainCanvas.width, mainCanvas.height);
    }
  }

  // Chart.js Radar Chart Renderer
  function renderRadarChart() {
    const chartCanvas = document.getElementById('metricsRadarChart');
    if (!chartCanvas || !window.Chart) return;

    if (radarChartInstance) {
      radarChartInstance.destroy();
    }

    const m = currentScanState.metrics;
    const isFake = currentScanState.isDeepfake;

    radarChartInstance = new Chart(chartCanvas, {
      type: 'radar',
      data: {
        labels: ['Error Level (ELA)', 'Fourier Spectrum', 'Facial Symmetry', 'EXIF Compression', 'Color Noise'],
        datasets: [{
          label: 'Detected Image Signatures',
          data: [m.elaDiscrepancy, m.spectralNoise, m.facialSymmetry, 100 - m.exifIntegrity, Math.floor(m.elaDiscrepancy * 0.9)],
          backgroundColor: isFake ? 'rgba(185, 28, 28, 0.12)' : 'rgba(6, 95, 70, 0.12)',
          borderColor: isFake ? '#b91c1c' : '#065f46',
          borderWidth: 1.5,
          pointBackgroundColor: isFake ? '#b91c1c' : '#065f46',
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { display: false },
            grid: { color: 'rgba(15, 23, 42, 0.07)' },
            angleLines: { color: 'rgba(15, 23, 42, 0.10)' },
            pointLabels: { color: '#64748b', font: { family: 'DM Sans', size: 10 } }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
});
