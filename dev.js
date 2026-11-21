const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Launching Scanline Backend (Port 5000) & Frontend (Port 5173) simultaneously...\n');

const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

const frontend = spawn('npx', ['vite'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

backend.on('error', (err) => console.error('[Backend Error]:', err));
frontend.on('error', (err) => console.error('[Frontend Error]:', err));

function cleanup() {
  console.log('\nShutting down dev servers...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
