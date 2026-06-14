import { jsPDF } from "jspdf";

function exportHighToPDF(subject, predictions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const checkPage = (needed = 10) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header bar
  doc.setFillColor(30, 30, 40);
  doc.rect(0, 0, pageW, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(200, 180, 255);
  doc.text("QPred — High Confidence Questions", margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 170);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, pageW - margin, 12, { align: "right" });

  y = 28;

  // Subject title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 40);
  doc.text(subject, margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 140);
  doc.text("Only high confidence predicted questions are included in this export.", margin, y);
  y += 10;

  // Divider
  doc.setDrawColor(200, 200, 215);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  const modules = Object.keys(predictions);
  let totalQ = 0;

  modules.forEach((mod) => {
    const result = predictions[mod];
    if (!result || result.parse_error) return;

    const highQs = (result.questions || []).filter(
      (q) => q.confidence?.toLowerCase() === "high"
    );
    if (highQs.length === 0) return;

    checkPage(16);

    // Module header
    doc.setFillColor(245, 243, 255);
    doc.roundedRect(margin, y, contentW, 9, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 80, 200);
    doc.text(mod.toUpperCase(), margin + 4, y + 6);
    y += 14;

    highQs.forEach((q, idx) => {
      totalQ++;

      // Question text — wrap it
      const questionLines = doc.splitTextToSize(
        `Q${idx + 1}.  ${q.question}`,
        contentW - 8
      );
      const blockH = questionLines.length * 5.5 + 16;
      checkPage(blockH + 4);

      // Card background
      doc.setFillColor(252, 252, 255);
      doc.setDrawColor(220, 215, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentW, blockH, 2, 2, "FD");

      // High badge
      doc.setFillColor(106, 255, 212);
      doc.roundedRect(pageW - margin - 18, y + 4, 14, 5, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(10, 80, 60);
      doc.text("HIGH", pageW - margin - 11, y + 7.8, { align: "center" });

      // Question text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 30, 45);
      doc.text(questionLines, margin + 4, y + 8);

      // Meta row
      const metaY = y + blockH - 7;
      if (q.topic) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(140, 120, 200);
        doc.text(`📌 ${q.topic}`, margin + 4, metaY);
      }
      if (q.type) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 180);
        doc.text(q.type.toUpperCase(), pageW - margin - 4, metaY, { align: "right" });
      }

      y += blockH + 5;
    });

    y += 4;
  });

  // Footer on last page
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 195);
  doc.text(
    `${totalQ} high confidence question${totalQ !== 1 ? "s" : ""} exported · QPred`,
    pageW / 2,
    pageH - 8,
    { align: "center" }
  );

  doc.save(`${subject.replace(/\s+/g, "_")}_high_questions.pdf`);
}

export default function Results({ data, onBack }) {
  const { subject, predictions } = data;
  const modules = Object.keys(predictions);

  const highCount = modules.reduce((acc, m) => {
    const qs = predictions[m]?.questions || [];
    return acc + qs.filter((q) => q.confidence?.toLowerCase() === "high").length;
  }, 0);

  return (
    <div>
      <button className="btn-back" onClick={onBack}>← New Prediction</button>

      <div className="results-header">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2>{subject}</h2>
            <p>{modules.length} module{modules.length !== 1 ? "s" : ""} · {
              modules.reduce((acc, m) => acc + (predictions[m]?.questions?.length || 0), 0)
            } questions predicted</p>
          </div>
          {highCount > 0 && (
            <button
              className="btn-export"
              onClick={() => exportHighToPDF(subject, predictions)}
            >
              ↓ Export High Questions (PDF)
            </button>
          )}
        </div>
      </div>

      {modules.map((mod) => {
        const result = predictions[mod];
        if (!result) return null;

        if (result.parse_error) {
          return (
            <div className="module-result" key={mod}>
              <div className="module-result-header">
                <div className="module-result-title">{mod}</div>
              </div>
              <div className="error-box">
                Could not parse structured response. Raw output:
                <pre style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 12 }}>
                  {result.raw_response}
                </pre>
              </div>
            </div>
          );
        }

        return (
          <div className="module-result" key={mod}>
            <div className="module-result-header">
              <div className="module-result-title">{mod}</div>
              <span style={{ color: "var(--text-dimmer)", fontSize: 12 }}>
                {result.questions?.length || 0} questions
              </span>
            </div>

            {result.topics_identified?.length > 0 && (
              <div className="topics-row">
                {result.topics_identified.map((t, i) => (
                  <span className="topic-chip" key={i}>{t}</span>
                ))}
              </div>
            )}

            {(result.questions || []).map((q, i) => (
              <div className="question-card" key={i}>
                <div className="q-num">Q{q.id || i + 1}</div>
                <div className="q-body">
                  <div className="q-text">{q.question}</div>
                  <div className="q-meta">
                    {q.topic && <span className="q-topic">📌 {q.topic}</span>}
                    {q.type && <span className="q-type">{q.type}</span>}
                  </div>
                  {q.reason && <div className="q-reason">"{q.reason}"</div>}
                </div>
                {q.confidence && (
                  <span className={`confidence ${q.confidence.toLowerCase()}`}>
                    {q.confidence}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}