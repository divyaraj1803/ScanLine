/* ==========================================================================
   VeriVision AI - Audit Log History Manager & Comparative Viewer
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const historyTableBody = document.getElementById('historyTableBody');
  const historySearchInput = document.getElementById('historySearchInput');
  const filterTypeSelect = document.getElementById('filterTypeSelect');

  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');

  // Compare Modal
  const compareModal = document.getElementById('compareModal');
  const compareCloseBtn = document.getElementById('compareCloseBtn');

  let historyData = [];

  // Initial Load
  loadHistoryTable();

  // Search & Filter Listeners
  if (historySearchInput) {
    historySearchInput.addEventListener('input', filterAndRender);
  }

  if (filterTypeSelect) {
    filterTypeSelect.addEventListener('change', filterAndRender);
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all forensic audit history logs?')) {
        VeriUtils.clearHistory();
        loadHistoryTable();
      }
    });
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(historyData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `VeriVision_Audit_Log_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  if (compareCloseBtn && compareModal) {
    compareCloseBtn.addEventListener('click', () => {
      compareModal.classList.remove('active');
    });
  }

  function loadHistoryTable() {
    historyData = VeriUtils.getHistory();
    filterAndRender();
  }

  function filterAndRender() {
    if (!historyTableBody) return;

    const query = historySearchInput ? historySearchInput.value.toLowerCase() : '';
    const filter = filterTypeSelect ? filterTypeSelect.value : 'all';

    let filtered = historyData.filter(item => {
      const matchesSearch = item.fileName.toLowerCase().includes(query) || item.id.toLowerCase().includes(query);
      let matchesFilter = true;
      if (filter === 'fake') matchesFilter = item.isDeepfake;
      if (filter === 'real') matchesFilter = !item.isDeepfake;
      return matchesSearch && matchesFilter;
    });

    historyTableBody.innerHTML = '';

    if (filtered.length === 0) {
      historyTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 3rem; color: var(--text-muted);">
            <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.75rem; display:block; color: var(--teal-glow);"></i>
            <strong style="color:#fff; display:block; margin-bottom:0.35rem;">No scan history yet</strong>
            Every image you analyse on the Scanner Studio is <strong style="color:var(--teal-glow);">automatically saved here</strong>.<br>
            <a href="index.html" style="color:var(--teal-glow); font-family:var(--font-mono); font-size:0.82rem; margin-top:0.6rem; display:inline-block;">→ Go to Scanner Studio</a>
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');

      const isFake = item.isDeepfake;
      const badgeHtml = isFake
        ? `<span class="badge-deepfake"><i class="fa-solid fa-triangle-exclamation"></i> AI DEEPFAKE (${item.confidenceScore}%)</span>`
        : `<span class="badge-real"><i class="fa-solid fa-shield-check"></i> REAL PHOTO (${(100 - item.confidenceScore).toFixed(1)}%)</span>`;

      tr.innerHTML = `
        <td><strong style="font-family: var(--font-mono); color: var(--cyan-glow);">${item.id}</strong></td>
        <td>
          <div style="display:flex; align-items:center; gap: 0.75rem;">
            <div style="width: 36px; height: 36px; border-radius: 6px; background: rgba(0,242,254,0.1); display:flex; align-items:center; justify-content:center; color: var(--cyan-glow);">
              <i class="fa-regular fa-image"></i>
            </div>
            <div>
              <div style="font-weight:600; color: #fff;">${item.fileName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${item.dimensions || '1024x1024'} • ${item.fileSize || '1.8 MB'}</div>
            </div>
          </div>
        </td>
        <td>${badgeHtml}</td>
        <td style="font-family: var(--font-mono); font-size: 0.85rem;">${item.modelFingerprint || 'Generative Diffusion'}</td>
        <td style="font-size: 0.85rem; color: var(--text-muted);">${VeriUtils.formatDate(item.timestamp)}</td>
        <td>
          <div style="display:flex; gap: 0.4rem;">
            <button class="btn btn-sm btn-pdf download-item-pdf" data-id="${item.id}" title="Re-download Forensic PDF Report">
              <i class="fa-solid fa-file-pdf"></i> PDF
            </button>
            <button class="btn btn-sm btn-secondary delete-item-btn" data-id="${item.id}" title="Delete Record">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      `;

      historyTableBody.appendChild(tr);
    });

    // Attach row button events
    document.querySelectorAll('.download-item-pdf').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const scanObj = historyData.find(h => h.id === id);
        if (scanObj) {
          PDFReportExporter.generatePDF(scanObj);
        }
      });
    });

    document.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        historyData = VeriUtils.deleteHistoryItem(id);
        filterAndRender();
      });
    });
  }
});
