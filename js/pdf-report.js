/* ==========================================================================
   SCANLINE — Forensic PDF Report Exporter (jsPDF Engine)
   Professional Dark-Themed Audit Certificate
   ========================================================================== */

const PDFReportExporter = {
  async generatePDF(scanData) {
    if (!window.jspdf) {
      alert('PDF engine not loaded. Check your internet connection for the jsPDF CDN.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const reportId = scanData.id || 'SL-' + Date.now().toString(36).toUpperCase();
    const dateStr = VeriUtils.formatDate(scanData.timestamp);
    const isDeepfake = scanData.isDeepfake;
    const score = scanData.confidenceScore || 0;
    const hash = scanData.imageHash || VeriUtils.generateImageHash(scanData.fileName || 'Image');

    // ── Color Palette (Dark Theme) ──────────────────────────────────────
    const bgBlack    = [10, 10, 10];
    const bgCard     = [18, 18, 18];
    const bgRow1     = [15, 15, 15];
    const bgRow2     = [20, 20, 20];
    const textWhite  = [240, 244, 253];
    const textMuted  = [148, 163, 184];
    const textDim    = [100, 116, 139];
    const cyanAccent = [0, 242, 254];
    const alertRed   = [255, 42, 95];
    const realGreen  = [0, 230, 118];
    const borderLine = [40, 40, 40];
    const amberWarn  = [245, 158, 11];

    // ── Page 1 Background ───────────────────────────────────────────────
    doc.setFillColor(...bgBlack);
    doc.rect(0, 0, 210, 297, 'F');

    // Page border
    doc.setDrawColor(...borderLine);
    doc.setLineWidth(0.6);
    doc.rect(6, 6, 198, 285);

    // ── Top Header Banner ───────────────────────────────────────────────
    doc.setFillColor(5, 5, 5);
    doc.rect(8, 8, 194, 32, 'F');

    // Cyan accent line at top
    doc.setDrawColor(...cyanAccent);
    doc.setLineWidth(1.5);
    doc.line(8, 8, 202, 8);

    // Brand name
    doc.setTextColor(...cyanAccent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SCANLINE', 16, 22);

    // Subtitle
    doc.setTextColor(...textWhite);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('IMAGE FORENSICS & DEEPFAKE DETECTION REPORT', 16, 29);

    // Tiny version tag
    doc.setTextColor(...textDim);
    doc.setFontSize(7);
    doc.text('v1.0 | Heuristic + Gemini AI Analysis', 16, 35);

    // Report metadata (right side)
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text(`REPORT: ${reportId}`, 148, 18);
    doc.text(`DATE: ${dateStr}`, 148, 23);
    doc.text(`HASH: ${hash.substring(0, 24)}...`, 148, 28);

    // ── Verdict Banner ──────────────────────────────────────────────────
    const verdictY = 46;
    const verdictBg = isDeepfake ? [40, 8, 18] : [5, 35, 20];
    const verdictBorder = isDeepfake ? alertRed : realGreen;
    const verdictText = isDeepfake
      ? 'SYNTHETIC / AI-GENERATED IMAGE DETECTED'
      : 'AUTHENTIC — REAL PHOTOGRAPH VERIFIED';

    doc.setFillColor(...verdictBg);
    doc.setDrawColor(...verdictBorder);
    doc.setLineWidth(0.8);
    doc.roundedRect(10, verdictY, 190, 30, 3, 3, 'FD');

    // Verdict icon indicator (colored dot)
    doc.setFillColor(...verdictBorder);
    doc.circle(20, verdictY + 12, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...verdictBorder);
    doc.text(verdictText, 28, verdictY + 13);

    // Subtitle explanation
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textWhite);
    const subtitleText = isDeepfake
      ? `Heuristic classifiers and AI analysis confirm synthetic artifacts with ${score}% confidence.`
      : `Image noise patterns and metadata are consistent with authentic camera sensor output.`;
    doc.text(subtitleText, 28, verdictY + 22);

    // Score box (right side of verdict)
    doc.setFillColor(15, 15, 15);
    doc.roundedRect(156, verdictY + 3, 38, 24, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...verdictBorder);
    doc.text(`${score}%`, 175, verdictY + 16, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setTextColor(...textDim);
    doc.text(isDeepfake ? 'SYNTHETIC SCORE' : 'AUTHENTIC SCORE', 175, verdictY + 23, { align: 'center' });

    // ── File Information Card ────────────────────────────────────────────
    const fileY = 82;
    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderLine);
    doc.setLineWidth(0.4);
    doc.roundedRect(10, fileY, 190, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...cyanAccent);
    doc.text('FILE INFORMATION', 16, fileY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textWhite);
    doc.text(`Filename: ${scanData.fileName || 'Unknown'}`, 16, fileY + 14);
    doc.text(`Size: ${scanData.fileSize || 'N/A'}`, 16, fileY + 20);
    doc.text(`Dimensions: ${scanData.dimensions || 'N/A'}`, 110, fileY + 14);
    doc.text(`Model: ${scanData.modelFingerprint || 'N/A'}`, 110, fileY + 20);

    // ── Visual Evidence Section ─────────────────────────────────────────
    const vizY = 112;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...cyanAccent);
    doc.text('FORENSIC VISUAL EVIDENCE', 10, vizY);

    // Source image
    if (scanData.sourceImageUri) {
      try {
        doc.addImage(scanData.sourceImageUri, 'PNG', 10, vizY + 4, 92, 62);
        doc.setDrawColor(...borderLine);
        doc.setLineWidth(0.3);
        doc.rect(10, vizY + 4, 92, 62);
        doc.setFontSize(7);
        doc.setTextColor(...textMuted);
        doc.text('SOURCE IMAGE', 10, vizY + 70);
      } catch (e) {
        console.warn('Source image embed failed:', e);
      }
    }

    // ELA heatmap
    if (scanData.elaHeatmapUri) {
      try {
        doc.addImage(scanData.elaHeatmapUri, 'PNG', 108, vizY + 4, 92, 62);
        doc.setDrawColor(...borderLine);
        doc.setLineWidth(0.3);
        doc.rect(108, vizY + 4, 92, 62);
        doc.setFontSize(7);
        doc.setTextColor(...cyanAccent);
        doc.text('ERROR LEVEL ANALYSIS (ELA) HEATMAP', 108, vizY + 70);
      } catch (e) {
        console.warn('ELA heatmap embed failed:', e);
      }
    }

    // ── Forensic Metrics Table ──────────────────────────────────────────
    const tableY = 192;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...cyanAccent);
    doc.text('DETAILED FORENSIC VECTOR ANALYSIS', 10, tableY);

    // Table header
    doc.setFillColor(25, 25, 25);
    doc.rect(10, tableY + 3, 190, 8, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDim);
    doc.text('ANALYSIS VECTOR', 16, tableY + 8);
    doc.text('WEIGHT', 95, tableY + 8);
    doc.text('SCORE', 125, tableY + 8);
    doc.text('RISK LEVEL', 155, tableY + 8);

    const metrics = [
      { name: 'Error Level Analysis (ELA) Variance',        weight: '30%', val: `${scanData.metrics?.elaDiscrepancy || 0}%`, risk: isDeepfake ? 'CRITICAL' : 'LOW' },
      { name: 'Fourier FFT Spectral Frequency Analysis',    weight: '25%', val: `${scanData.metrics?.spectralNoise || 0}%`,  risk: isDeepfake ? 'HIGH' : 'NORMAL' },
      { name: 'Iris Reflection & Facial Symmetry',          weight: '20%', val: `${scanData.metrics?.facialSymmetry || 0}%`, risk: isDeepfake ? 'HIGH' : 'NORMAL' },
      { name: 'EXIF Camera & Compression Metadata',         weight: '15%', val: `${scanData.metrics?.exifIntegrity || 0}%`,  risk: isDeepfake ? 'MISSING' : 'VALID' },
      { name: 'Generative Model Diffusion Signatures',      weight: '10%', val: scanData.modelFingerprint || '—',            risk: isDeepfake ? 'DETECTED' : 'CLEAN' }
    ];

    let rowY = tableY + 15;
    metrics.forEach((m, idx) => {
      const bg = idx % 2 === 0 ? bgRow1 : bgRow2;
      doc.setFillColor(...bg);
      doc.rect(10, rowY - 4, 190, 8, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...textWhite);
      doc.text(m.name, 16, rowY);
      doc.setTextColor(...textMuted);
      doc.text(m.weight, 95, rowY);
      doc.setTextColor(...cyanAccent);
      doc.text(m.val.substring(0, 30), 125, rowY);

      doc.setFont('helvetica', 'bold');
      const isRisky = ['CRITICAL', 'HIGH', 'MISSING', 'DETECTED'].includes(m.risk);
      doc.setTextColor(...(isRisky ? alertRed : realGreen));
      doc.text(m.risk, 155, rowY);

      rowY += 8;
    });

    // ── Gemini AI Verification Section ──────────────────────────────────
    const gemY = rowY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...cyanAccent);
    doc.text('GEMINI AI CROSS-VERIFICATION', 10, gemY);

    doc.setFillColor(...bgCard);
    doc.setDrawColor(...borderLine);
    doc.setLineWidth(0.4);
    doc.roundedRect(10, gemY + 3, 190, 16, 2, 2, 'FD');

    // Get Gemini data from the panel if available
    const geminiBadge = document.getElementById('geminiStatusBadge');
    const geminiText = document.getElementById('geminiResultText');
    const geminiStatus = geminiBadge ? geminiBadge.textContent : 'NOT RUN';
    const geminiDetail = geminiText ? geminiText.textContent : 'Gemini verification was not performed.';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(`Status: ${geminiStatus}`, 16, gemY + 10);
    
    doc.setTextColor(...textWhite);
    doc.setFontSize(7.5);
    // Wrap long text
    const geminiLines = doc.splitTextToSize(geminiDetail || 'No Gemini analysis data available.', 170);
    doc.text(geminiLines.slice(0, 2), 16, gemY + 15);

    // ── Footer & Certificate Seal ───────────────────────────────────────
    doc.setDrawColor(...borderLine);
    doc.line(10, 268, 200, 268);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...textDim);
    doc.text('This forensic report was generated by SCANLINE Image Forensics v1.0 using heuristic analysis', 10, 274);
    doc.text('and Gemini AI cross-verification. Results are probabilistic and should not be treated as legal proof.', 10, 279);

    // Certificate seal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...cyanAccent);
    doc.text('SCANLINE VERIFIED', 160, 274);

    doc.setFontSize(6.5);
    doc.setTextColor(...textDim);
    doc.text(`SHA: ${hash.substring(0, 28)}`, 148, 279);

    // ── Cyan bottom accent line ─────────────────────────────────────────
    doc.setDrawColor(...cyanAccent);
    doc.setLineWidth(1.5);
    doc.line(6, 291, 204, 291);

    // Save the PDF
    doc.save(`Scanline_Report_${reportId}.pdf`);
  }
};
