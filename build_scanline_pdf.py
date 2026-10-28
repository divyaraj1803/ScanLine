from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.utils import simpleSplit
from pathlib import Path

OUT = Path('output/pdf/ScanLine_refined.pdf')
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = 960, 540
NAVY = HexColor('#17324D')
BLUE = HexColor('#2B6CB0')
INK = HexColor('#1F2933')
MUTED = HexColor('#5B6775')
LINE = HexColor('#D9E1E8')
PALE = HexColor('#F5F8FB')
LIGHT_BLUE = HexColor('#EAF2FB')
GREEN = HexColor('#16876A')
AMBER = HexColor('#B7791F')
RED = HexColor('#B84343')

c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
c.setTitle('ScanLine - Deepfake Detection and Support System')
c.setAuthor('ScanLine project team')

def rect(x, y, w, h, color, stroke=None, radius=0):
    c.setFillColor(color)
    c.setStrokeColor(stroke or color)
    if radius:
        c.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)
    else:
        c.rect(x, y, w, h, fill=1, stroke=1 if stroke else 0)

def text(x, y, s, size=16, color=INK, font='Helvetica', align='left'):
    c.setFillColor(color); c.setFont(font, size)
    if align == 'center': c.drawCentredString(x, y, s)
    elif align == 'right': c.drawRightString(x, y, s)
    else: c.drawString(x, y, s)

def paragraph(x, y, s, width, size=15, leading=None, color=MUTED, font='Helvetica'):
    leading = leading or size * 1.42
    c.setFillColor(color); c.setFont(font, size)
    lines = simpleSplit(s, font, size, width)
    for line in lines:
        c.drawString(x, y, line); y -= leading
    return y

def footer(n):
    c.setStrokeColor(LINE); c.setLineWidth(0.7); c.line(48, 32, W-48, 32)
    text(48, 16, 'SCANLINE  |  Deepfake detection and support system', 8.5, MUTED)
    text(W-48, 16, f'{n:02d}', 8.5, MUTED, align='right')

def page(title, kicker, n):
    rect(0, 0, W, H, white)
    rect(48, 486, 44, 4, BLUE)
    text(48, 458, kicker.upper(), 9, BLUE, 'Helvetica-Bold')
    text(48, 414, title, 29, NAVY, 'Helvetica-Bold')
    footer(n)

def bullet(x, y, title, body, width=350, accent=BLUE):
    rect(x, y+4, 7, 7, accent, radius=3.5)
    text(x+20, y, title, 13, INK, 'Helvetica-Bold')
    return paragraph(x+20, y-21, body, width-20, 11.5, 16, MUTED)

def card(x, y, w, h, heading, body, accent=BLUE):
    rect(x, y, w, h, PALE, LINE, 8)
    rect(x, y+h-5, w, 5, accent)
    text(x+18, y+h-35, heading, 14, NAVY, 'Helvetica-Bold')
    paragraph(x+18, y+h-60, body, w-36, 11.2, 15, MUTED)

def inspection_illustration(x, y, scale=1):
    """A compact line illustration for a manual editorial look."""
    c.setLineCap(1); c.setLineJoin(1)
    rect(x, y, 220*scale, 145*scale, LIGHT_BLUE, None, 10*scale)
    c.setStrokeColor(NAVY); c.setLineWidth(2*scale)
    c.circle(x+88*scale, y+78*scale, 38*scale, stroke=1, fill=0)
    c.line(x+115*scale, y+51*scale, x+162*scale, y+19*scale)
    c.setStrokeColor(BLUE); c.setLineWidth(1.1*scale)
    for dx, dy, r in [(76, 91, 8), (100, 69, 5), (88, 55, 10), (106, 91, 6)]:
        c.circle(x+dx*scale, y+dy*scale, r*scale, stroke=1, fill=0)
    c.setStrokeColor(HexColor('#8DA6BB')); c.setDash(3*scale, 3*scale)
    c.rect(x+48*scale, y+38*scale, 83*scale, 83*scale, stroke=1, fill=0)
    c.setDash()
    text(x+164*scale, y+33*scale, 'REVIEW', 8*scale, NAVY, 'Helvetica-Bold')

def report_illustration(x, y, scale=1):
    rect(x, y, 188*scale, 140*scale, PALE, LINE, 8*scale)
    rect(x+35*scale, y+20*scale, 94*scale, 102*scale, white, LINE, 3*scale)
    c.setStrokeColor(BLUE); c.setLineWidth(2*scale); c.line(x+50*scale, y+98*scale, x+114*scale, y+98*scale)
    c.setStrokeColor(LINE); c.setLineWidth(1*scale)
    for yy in [82, 69, 56]: c.line(x+50*scale, y+yy*scale, x+113*scale, y+yy*scale)
    rect(x+50*scale, y+35*scale, 51*scale, 10*scale, GREEN, radius=5*scale)
    c.setStrokeColor(BLUE); c.setLineWidth(1.6*scale)
    c.line(x+130*scale, y+48*scale, x+151*scale, y+48*scale); c.line(x+145*scale, y+42*scale, x+151*scale, y+48*scale); c.line(x+145*scale, y+54*scale, x+151*scale, y+48*scale)

def dashboard_illustration(x, y, scale=1):
    rect(x, y, 260*scale, 142*scale, white, LINE, 8*scale)
    rect(x, y+112*scale, 260*scale, 30*scale, NAVY)
    text(x+16*scale, y+122*scale, 'ASSESSMENT', 8*scale, white, 'Helvetica-Bold')
    text(x+16*scale, y+83*scale, 'Signals to review', 13*scale, NAVY, 'Helvetica-Bold')
    rect(x+16*scale, y+57*scale, 200*scale, 9*scale, LINE, radius=4*scale)
    rect(x+16*scale, y+57*scale, 124*scale, 9*scale, AMBER, radius=4*scale)
    for dx, label, color in [(16, 'Metadata', BLUE), (102, 'Visual', GREEN), (171, 'Output', AMBER)]:
        rect(x+dx*scale, y+25*scale, 7*scale, 7*scale, color, radius=3.5*scale)
        text(x+(dx+12)*scale, y+23*scale, label, 7.5*scale, MUTED)

# 1
rect(0, 0, W, H, white)
rect(0, 0, 16, H, NAVY)
text(62, 438, 'SCANLINE', 12, BLUE, 'Helvetica-Bold')
text(62, 365, 'Verify media.', 42, NAVY, 'Helvetica-Bold')
text(62, 310, 'Understand the result.', 42, NAVY, 'Helvetica-Bold')
text(62, 255, 'Respond with confidence.', 42, NAVY, 'Helvetica-Bold')
paragraph(64, 188, 'An explainable deepfake detection and support system for safer decisions around digital media.', 560, 18, 25, MUTED)
rect(640, 126, 230, 250, LIGHT_BLUE, None, 10)
rect(675, 164, 160, 174, white, LINE, 8)
text(755, 292, 'MEDIA', 10, MUTED, 'Helvetica-Bold', 'center')
text(755, 264, 'CHECK', 18, NAVY, 'Helvetica-Bold', 'center')
c.setStrokeColor(BLUE); c.setLineWidth(2); c.line(704, 230, 806, 230)
for x, label, col in [(704, 'Source', GREEN), (755, 'Signals', AMBER), (806, 'Report', BLUE)]:
    rect(x-6, 217, 12, 12, col, radius=6); text(x, 197, label, 8, MUTED, align='center')
text(64, 82, 'Project presentation  |  Prepared by Pawan Kumar, Abhijeet Kumar Thakur, Suryan Karan Roshan and Divya Raj', 10, MUTED)
footer(1); c.showPage()

# 2
page('The problem: trust is now a decision, not a default.', 'Why ScanLine', 2)
paragraph(48, 360, 'Synthetic and manipulated media can travel quickly. People need more than a binary label: they need a clear result, a reason to review it, and a safe next action.', 790, 18, 25, MUTED)
card(48, 145, 250, 150, 'Misinformation', 'Misleading images can distort public understanding before verification catches up.', RED)
card(355, 145, 250, 150, 'Fraud and impersonation', 'Altered media can be used to pressure, deceive or imitate a trusted person.', AMBER)
card(662, 145, 250, 150, 'Evidence uncertainty', 'Investigators and users need a repeatable way to preserve and review media.', BLUE)
c.showPage()

# 3
page('A practical system: detect, explain, protect.', 'The ScanLine proposition', 3)
card(48, 185, 255, 145, '1  Detect', 'Analyze uploaded media for multiple manipulation signals. Present a calibrated confidence range, not certainty.', BLUE)
card(352, 185, 255, 145, '2  Explain', 'Show the strongest contributing signals in plain language and provide an inspection view for reviewers.', GREEN)
card(656, 185, 255, 145, '3  Protect', 'Create a shareable record, preserve the original file details, and guide the user to appropriate next steps.', AMBER)
text(48, 118, 'Design principle', 10, BLUE, 'Helvetica-Bold')
paragraph(48, 92, 'ScanLine supports human judgement. It is a decision aid, not a final authority on authenticity.', 650, 14, 20, MUTED)
c.showPage()

# 4
page('How ScanLine works', 'End-to-end workflow', 4)
steps = [('Upload', 'User selects an image or media file.'), ('Preserve', 'Create a file fingerprint and record basic metadata.'), ('Analyze', 'Run complementary detection checks.'), ('Explain', 'Summarize findings and visual evidence.'), ('Respond', 'Export report or follow recommended next steps.')]
x0, y0, gap = 48, 245, 170
for i, (head, body) in enumerate(steps):
    x = x0 + i*gap
    rect(x, y0, 135, 112, PALE, LINE, 8)
    rect(x+16, y0+73, 26, 26, BLUE if i < 3 else GREEN, radius=13)
    text(x+29, y0+81, str(i+1), 10, white, 'Helvetica-Bold', 'center')
    text(x+16, y0+52, head, 13, NAVY, 'Helvetica-Bold')
    paragraph(x+16, y0+33, body, 104, 9.6, 12.5, MUTED)
    if i < 4:
        c.setStrokeColor(BLUE); c.setLineWidth(1.5); c.line(x+135, y0+56, x+gap-12, y0+56)
        c.line(x+gap-18, y0+62, x+gap-12, y0+56); c.line(x+gap-18, y0+50, x+gap-12, y0+56)
paragraph(48, 150, 'Each stage produces a traceable record so a reviewer can understand what was assessed and what should happen next.', 760, 15, 21, MUTED)
c.showPage()

# 5
page('What the system examines', 'Signal categories', 5)
card(48, 240, 260, 116, 'Visual consistency', 'Lighting, shadows, texture, edges and local image artifacts that may warrant closer review.', BLUE)
card(350, 240, 260, 116, 'Image provenance', 'Available metadata, file structure and duplicate or altered-file indicators.', GREEN)
card(652, 240, 260, 116, 'Model-based cues', 'Patterns identified by trained classifiers and explainability overlays.', AMBER)
inspection_illustration(700, 88, .82)
paragraph(48, 170, 'No single signal proves that a file is real or fake. Combining independent checks makes the review more useful and more transparent.', 575, 15, 21, MUTED)
text(48, 115, 'Important', 10, RED, 'Helvetica-Bold')
paragraph(48, 92, 'A result should be treated as a screening outcome and escalated for human review when the impact is high.', 575, 12, 17, MUTED)
c.showPage()

# 6
page('From upload to an understandable result', 'User experience', 6)
bullet(62, 333, 'Simple input', 'A focused upload screen accepts a file and explains what data is retained for the assessment.', 390, BLUE)
bullet(62, 247, 'Clear result', 'A review status, confidence range and concise summary help users interpret the outcome without technical jargon.', 390, GREEN)
bullet(62, 161, 'Useful actions', 'Users can save a report, retain the original, seek a second review or follow support guidance.', 390, AMBER)
rect(560, 140, 305, 230, PALE, LINE, 10)
text(590, 332, 'ASSESSMENT SUMMARY', 9, BLUE, 'Helvetica-Bold')
text(590, 296, 'Review recommended', 19, NAVY, 'Helvetica-Bold')
rect(590, 253, 245, 12, LINE, radius=6); rect(590, 253, 157, 12, AMBER, radius=6)
text(590, 231, 'Signal confidence: moderate', 10, MUTED)
text(590, 196, 'Top observations', 10, NAVY, 'Helvetica-Bold')
text(602, 174, '- inconsistent edge texture', 10, MUTED)
text(602, 154, '- metadata unavailable', 10, MUTED)
c.showPage()

# 7
page('Core capabilities in one place', 'Product scope', 7)
items = [('Single and batch checks', 'Review one file or organize a controlled set for triage.'), ('Review history', 'Keep a searchable log of submitted assessments and reports.'), ('Confidence communication', 'Use plain-language statuses alongside technical context.'), ('Evidence package', 'Export a dated summary with original-file reference information.'), ('Explainability view', 'Surface the signals that contributed most to the model output.'), ('Guided escalation', 'Direct users to internal, legal or cybercrime support channels as appropriate.')]
for i, (h, b) in enumerate(items):
    col, row = i % 3, i // 3
    card(48+col*292, 285-row*155, 260, 118, h, b, [BLUE, GREEN, AMBER][col])
c.showPage()

# 8
page('Explainability turns a score into a conversation.', 'Responsible AI', 8)
paragraph(48, 360, 'A useful system shows why a result deserves attention, while making its uncertainty explicit. ScanLine can pair a model output with a visual heatmap and a short explanation of the strongest observed signals.', 790, 17, 24, MUTED)
rect(48, 175, 400, 115, LIGHT_BLUE, None, 8)
text(70, 252, 'What users see', 13, NAVY, 'Helvetica-Bold')
paragraph(70, 226, 'Status - confidence range - top signals - visual inspection area - recommended next step', 345, 12, 17, MUTED)
rect(510, 175, 400, 115, PALE, LINE, 8)
text(532, 252, 'What reviewers see', 13, NAVY, 'Helvetica-Bold')
paragraph(532, 226, 'File reference - processing time - model version - reviewed signals - exportable notes', 345, 12, 17, MUTED)
dashboard_illustration(650, 72, .70)
text(48, 118, 'Outcome', 10, BLUE, 'Helvetica-Bold')
paragraph(48, 94, 'The result is easier to challenge, compare and document - essential when decisions affect people.', 760, 13, 18, MUTED)
c.showPage()

# 9
page('Preserve evidence without overclaiming.', 'Trust and safety', 9)
bullet(48, 344, 'Record the original', 'Retain the submitted file reference, file hash, upload time and any available metadata.', 420, BLUE)
bullet(48, 257, 'Separate assessment from verdict', 'Clearly distinguish model signals from factual conclusions or legal determinations.', 420, AMBER)
bullet(48, 170, 'Protect sensitive material', 'Use access controls, defined retention periods and secure sharing for reports and source media.', 420, GREEN)
rect(570, 152, 300, 215, NAVY, None, 10)
text(600, 326, 'REPORT RECORD', 9, HexColor('#A9C8E8'), 'Helvetica-Bold')
for yy, lab in [(290, 'File fingerprint'), (260, 'Assessment time'), (230, 'Model and version'), (200, 'Reviewer notes')]:
    text(600, yy, lab, 11, white, 'Helvetica-Bold'); c.setStrokeColor(HexColor('#54718A')); c.line(600, yy-11, 838, yy-11)
c.showPage()

# 10
page('A staged path from prototype to dependable service', 'Implementation roadmap', 10)
road = [('Phase 1', 'Prototype', 'Image intake, baseline detection, simple report.'), ('Phase 2', 'Review workflow', 'Explainability screen, history, role-based review.'), ('Phase 3', 'Quality and security', 'Validation set, monitoring, privacy and retention controls.'), ('Phase 4', 'Broader access', 'Browser workflow, multilingual guidance and integration options.')]
for i, (phase, h, b) in enumerate(road):
    y = 340 - i*68
    rect(56, y, 120, 42, BLUE if i < 2 else NAVY, radius=6)
    text(116, y+15, phase, 11, white, 'Helvetica-Bold', 'center')
    text(208, y+19, h, 14, NAVY, 'Helvetica-Bold')
    text(390, y+19, b, 11.5, MUTED)
    if i < 3: c.setStrokeColor(LINE); c.line(56, y-20, 900, y-20)
paragraph(56, 89, 'Each phase should be evaluated against real user needs, safety requirements and documented performance limits.', 760, 13, 18, MUTED)
c.showPage()

# 11
page('Measure what matters, then communicate it honestly.', 'Validation and governance', 11)
card(48, 240, 250, 130, 'Quality checks', 'Measure performance across varied sources, compression levels, demographics and manipulation types.', BLUE)
card(355, 240, 250, 130, 'Human review', 'Test whether people can understand the result, identify uncertainty and take the right next action.', GREEN)
card(662, 240, 250, 130, 'Ongoing monitoring', 'Track drift, false positives, false negatives and feedback from reviewers after release.', AMBER)
text(48, 163, 'Recommended safeguards', 10, BLUE, 'Helvetica-Bold')
paragraph(48, 137, 'Versioned models - clear limitations - escalation path - audit logs - periodic independent review', 760, 14, 20, MUTED)
report_illustration(715, 70, .78)
c.showPage()

# 12
rect(0, 0, W, H, NAVY)
rect(48, 430, 48, 4, HexColor('#69B3E7'))
text(48, 370, 'Detect.', 42, white, 'Helvetica-Bold')
text(48, 318, 'Explain.', 42, white, 'Helvetica-Bold')
text(48, 266, 'Protect.', 42, white, 'Helvetica-Bold')
paragraph(50, 185, 'ScanLine is designed to make deepfake assessments clearer, more traceable and more actionable - with people kept in the loop.', 570, 18, 25, HexColor('#D7E4F0'))
rect(695, 175, 170, 150, HexColor('#244765'), None, 10)
text(780, 268, 'THANK YOU', 15, white, 'Helvetica-Bold', 'center')
text(780, 237, 'Questions?', 18, HexColor('#A9C8E8'), 'Helvetica-Bold', 'center')
text(48, 67, 'SCANLINE  |  Deepfake detection and support system', 9, HexColor('#A9C8E8'))
text(W-48, 67, '12', 9, HexColor('#A9C8E8'), align='right')
c.showPage()

c.save()
print(OUT.resolve())
