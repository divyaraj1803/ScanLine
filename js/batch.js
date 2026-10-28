/* ==========================================================================
   VeriVision AI - Batch Scanner & Developer API Sandbox Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const batchFileInput = document.getElementById('batchFileInput');
  const batchDropzone = document.getElementById('batchDropzone');
  const batchFileList = document.getElementById('batchFileList');
  const runBatchBtn = document.getElementById('runBatchBtn');
  const batchProgressCard = document.getElementById('batchProgressCard');

  let selectedBatchFiles = [];

  if (batchDropzone && batchFileInput) {
    batchDropzone.addEventListener('click', () => batchFileInput.click());

    batchDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      batchDropzone.classList.add('dragover');
    });

    batchDropzone.addEventListener('dragleave', () => {
      batchDropzone.classList.remove('dragover');
    });

    batchDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      batchDropzone.classList.remove('dragover');
      if (e.dataTransfer.files) {
        addBatchFiles(Array.from(e.dataTransfer.files));
      }
    });

    batchFileInput.addEventListener('change', (e) => {
      if (e.target.files) {
        addBatchFiles(Array.from(e.target.files));
      }
    });
  }

  function addBatchFiles(files) {
    const valid = files.filter(f => f.type.startsWith('image/'));
    selectedBatchFiles = [...selectedBatchFiles, ...valid];
    renderBatchList();
  }

  function renderBatchList() {
    if (!batchFileList) return;
    batchFileList.innerHTML = '';

    if (selectedBatchFiles.length === 0) {
      batchFileList.innerHTML = '<div style="color: var(--text-muted); text-align:center; padding: 1rem;">No files selected yet.</div>';
      if (runBatchBtn) runBatchBtn.disabled = true;
      return;
    }

    if (runBatchBtn) runBatchBtn.disabled = false;

    selectedBatchFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'batch-file-item';
      item.innerHTML = `
        <div style="display:flex; align-items:center; gap: 0.75rem;">
          <i class="fa-regular fa-image" style="color: var(--cyan-glow); font-size: 1.2rem;"></i>
          <div>
            <div style="font-weight:600; color: #fff;">${file.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${(file.size / 1024).toFixed(1)} KB</div>
          </div>
        </div>
        <button class="btn btn-sm btn-secondary remove-batch-item" data-index="${index}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;
      batchFileList.appendChild(item);
    });

    document.querySelectorAll('.remove-batch-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        selectedBatchFiles.splice(idx, 1);
        renderBatchList();
      });
    });
  }

  if (runBatchBtn) {
    runBatchBtn.addEventListener('click', () => {
      if (selectedBatchFiles.length === 0) return;

      batchProgressCard.style.display = 'block';
      runBatchBtn.disabled = true;
      runBatchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Batch Queue...';

      let count = 0;
      const total = selectedBatchFiles.length;
      const progressBar = document.getElementById('batchProgressBar');
      const progressText = document.getElementById('batchProgressText');

      const interval = setInterval(() => {
        count++;
        const percent = Math.floor((count / total) * 100);
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `Scanned ${count} of ${total} files (${percent}%)`;

        // Save mock batch results to history
        const f = selectedBatchFiles[count - 1];
        if (f) {
          const isFake = f.name.toLowerCase().includes('fake') || count % 2 === 1;
          VeriUtils.saveScanToHistory({
            fileName: f.name,
            fileSize: `${(f.size / 1024).toFixed(1)} KB`,
            dimensions: '1024 x 1024',
            isDeepfake: isFake,
            confidenceScore: isFake ? 94.2 : 2.1,
            modelFingerprint: isFake ? 'Batch Queue Synthetic Analyzer' : 'Authentic Optics',
            metrics: { elaDiscrepancy: isFake ? 90 : 5, spectralNoise: isFake ? 88 : 10, facialSymmetry: 95, exifIntegrity: 20 }
          });
        }

        if (count >= total) {
          clearInterval(interval);
          setTimeout(() => {
            alert(`Batch scan completed! ${total} reports generated and saved to Audit Log history.`);
            runBatchBtn.innerHTML = '<i class="fa-solid fa-layer-group"></i> Run Batch Scanner Queue';
            runBatchBtn.disabled = false;
            selectedBatchFiles = [];
            renderBatchList();
            batchProgressCard.style.display = 'none';
          }, 600);
        }
      }, 500);
    });
  }
});
