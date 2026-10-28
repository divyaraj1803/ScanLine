/* ==========================================================================
   VeriVision AI - Shared Utility Functions & Local Storage Manager
   ========================================================================== */

const VeriUtils = {
  // Generate pseudo SHA-256 hash for image verification
  generateImageHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `0x${hex}${hex.split('').reverse().join('')}f89d3a7c1b2e4f5a6b0c`;
  },

  // Format timestamp
  formatDate(dateStr) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  // Storage Key
  HISTORY_KEY: 'verivision_scan_history_v1',

  // Save Scan Result to LocalStorage
  saveScanToHistory(scanData) {
    const history = this.getHistory();
    const newEntry = {
      id: 'SCAN-' + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toISOString(),
      fileName: scanData.fileName || 'Scanned_Image.png',
      fileSize: scanData.fileSize || '1.4 MB',
      dimensions: scanData.dimensions || '1024 x 1024',
      isDeepfake: scanData.isDeepfake,
      confidenceScore: scanData.confidenceScore,
      modelFingerprint: scanData.modelFingerprint || 'Unknown Synthetic Model',
      metrics: scanData.metrics,
      imageHash: scanData.imageHash || this.generateImageHash(scanData.fileName + Date.now()),
      imageDataUrl: scanData.imageDataUrl // Thumb
    };

    history.unshift(newEntry);
    // Keep max 30 records
    if (history.length > 30) history.pop();
    
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage full, trimming image thumbs...');
      // Trim image base64 if quota exceeded
      const trimmed = history.map(h => ({ ...h, imageDataUrl: null }));
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmed));
    }
    return newEntry;
  },

  // Get History List — real saved records only
  getHistory() {
    try {
      const data = localStorage.getItem(this.HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // Delete Item
  deleteHistoryItem(id) {
    let history = this.getHistory();
    history = history.filter(item => item.id !== id);
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    return history;
  },

  // Clear History
  clearHistory() {
    localStorage.removeItem(this.HISTORY_KEY);
  },

  // Pre-populated realistic sample history if empty
  getDefaultSampleHistory() {
    return [
      {
        id: 'SCAN-MJ6X98A',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        fileName: 'synthetic_portrait_v6.png',
        fileSize: '2.1 MB',
        dimensions: '1024 x 1024',
        isDeepfake: true,
        confidenceScore: 96.4,
        modelFingerprint: 'Midjourney v6.0 Diffusion',
        metrics: {
          elaDiscrepancy: 94,
          spectralNoise: 91,
          facialSymmetry: 98,
          exifIntegrity: 15
        },
        imageHash: '0x8f2a91b4c7e0f3a5b8c1d4e7f0a3b6c9d2e5f8a1',
        imageDataUrl: null
      },
      {
        id: 'SCAN-REAL72B',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        fileName: 'raw_nikon_portrait_2026.jpg',
        fileSize: '4.8 MB',
        dimensions: '2048 x 1536',
        isDeepfake: false,
        confidenceScore: 3.2,
        modelFingerprint: 'Authentic Photographic Camera',
        metrics: {
          elaDiscrepancy: 6,
          spectralNoise: 12,
          facialSymmetry: 42,
          exifIntegrity: 98
        },
        imageHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
        imageDataUrl: null
      },
      {
        id: 'SCAN-FLUX910',
        timestamp: new Date(Date.now() - 3600000 * 40).toISOString(),
        fileName: 'cyberpunk_character_flux.webp',
        fileSize: '1.8 MB',
        dimensions: '1280 x 720',
        isDeepfake: true,
        confidenceScore: 92.1,
        modelFingerprint: 'FLUX.1 Schnell Generator',
        metrics: {
          elaDiscrepancy: 88,
          spectralNoise: 95,
          facialSymmetry: 89,
          exifIntegrity: 10
        },
        imageHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
        imageDataUrl: null
      }
    ];
  },

  // Dynamic Canvas Generator for Sample Quick-Testing Images
  generateSampleCanvasImage(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    if (type === 'ai-portrait') {
      // Draw ultra futuristic AI synthetic portrait abstract background
      const grad = ctx.createRadialGradient(300, 300, 50, 300, 300, 300);
      grad.addColorStop(0, '#2e0854');
      grad.addColorStop(0.5, '#180b30');
      grad.addColorStop(1, '#080514');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 600);

      // AI Cyber Face Silhouette
      ctx.fillStyle = '#ff2a5f';
      ctx.shadowColor = '#ff2a5f';
      ctx.shadowBlur = 25;

      // Draw stylized portrait circle head
      ctx.beginPath();
      ctx.arc(300, 240, 110, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.beginPath();
      ctx.arc(260, 230, 16, 0, Math.PI * 2);
      ctx.arc(340, 230, 16, 0, Math.PI * 2);
      ctx.fill();

      // Synthetic grid lines (Diffusion pattern artifact)
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 600; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 40, 600);
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText('MIDJOURNEY V6 SYNTHETIC SAMPLE', 300, 540);

    } else if (type === 'real-photo') {
      // Natural organic background
      const grad = ctx.createLinearGradient(0, 0, 600, 600);
      grad.addColorStop(0, '#1c3144');
      grad.addColorStop(1, '#0f1b29');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 600);

      // Organic realistic camera photo representation
      ctx.fillStyle = '#00e676';
      ctx.shadowColor = '#00e676';
      ctx.shadowBlur = 15;

      // Mountain / Nature scene silhouette
      ctx.beginPath();
      ctx.moveTo(50, 480);
      ctx.lineTo(220, 220);
      ctx.lineTo(380, 480);
      ctx.fill();

      ctx.fillStyle = '#4facfe';
      ctx.shadowColor = '#4facfe';
      ctx.beginPath();
      ctx.moveTo(250, 480);
      ctx.lineTo(420, 180);
      ctx.lineTo(550, 480);
      ctx.fill();

      // Sun
      ctx.fillStyle = '#ffab00';
      ctx.beginPath();
      ctx.arc(150, 150, 50, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText('RAW NIKON Z9 PHOTOGRAPH SAMPLE', 300, 540);

    } else if (type === 'faceswap') {
      // Deepfake Face Swap sample
      const grad = ctx.createRadialGradient(300, 300, 10, 300, 300, 350);
      grad.addColorStop(0, '#3a1c71');
      grad.addColorStop(1, '#d76d77');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 600);

      ctx.strokeStyle = '#ff2a5f';
      ctx.lineWidth = 3;
      ctx.strokeRect(180, 140, 240, 260);

      ctx.fillStyle = '#ffab00';
      ctx.font = '16px JetBrains Mono';
      ctx.fillText('ANOMALY: UNNATURAL SEAM BOUNDARY DETECTED', 120, 120);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DEEPFACE SWAP REPLACEMENT SAMPLE', 300, 540);
    }

    return canvas.toDataURL('image/png');
  }
};
