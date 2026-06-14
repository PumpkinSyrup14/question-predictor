import { useState, useRef } from "react";

function DropZone({ label, multiple = true, files, onChange, accept = ".pdf" }) {
  const [active, setActive] = useState(false);
  const inputRef = useRef();

  const handleFiles = (incoming) => {
    const arr = Array.from(incoming);
    onChange(multiple ? [...files, ...arr] : arr);
  };

  const removeFile = (idx) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div
        className={`dropzone ${active ? "active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setActive(true); }}
        onDragLeave={() => setActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setActive(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="dropzone-text">
          <strong>Click or drag</strong> to upload {label}
          <br />
          <span style={{ fontSize: "11px" }}>PDF files only</span>
        </div>
      </div>
      {files.length > 0 && (
        <div className="file-chips">
          {files.map((f, i) => (
            <div className="file-chip" key={i}>
              📄 {f.name}
              <button onClick={() => removeFile(i)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UploadForm({ onSubmit, loading }) {
  const [subject, setSubject] = useState("");
  const [modules, setModules] = useState(["Module 1", "Module 2"]);
  const [pastPapers, setPastPapers] = useState([]);
  const [moduleNotes, setModuleNotes] = useState({});  // { moduleName: [File] }

  const addModule = () => {
    const name = `Module ${modules.length + 1}`;
    setModules([...modules, name]);
  };

  const removeModule = (idx) => {
    const removed = modules[idx];
    const updated = modules.filter((_, i) => i !== idx);
    setModules(updated);
    setModuleNotes((prev) => {
      const copy = { ...prev };
      delete copy[removed];
      return copy;
    });
  };

  const updateModuleName = (idx, val) => {
    const oldName = modules[idx];
    const updated = [...modules];
    updated[idx] = val;
    setModules(updated);
    // migrate notes key
    if (oldName !== val) {
      setModuleNotes((prev) => {
        const copy = { ...prev };
        if (copy[oldName]) {
          copy[val] = copy[oldName];
          delete copy[oldName];
        }
        return copy;
      });
    }
  };

  const setNotesForModule = (moduleName, files) => {
    setModuleNotes((prev) => ({ ...prev, [moduleName]: files }));
  };

  const canSubmit =
    subject.trim() &&
    modules.length > 0 &&
    modules.every((m) => m.trim()) &&
    !loading;

  const handleSubmit = () => {
    onSubmit({ subject, modules, pastPapers, moduleNotes });
  };

  return (
    <div>
      {/* Subject */}
      <div className="card">
        <div className="form-group">
          <label className="form-label">Subject Name</label>
          <input
            type="text"
            placeholder="e.g. Design and Analysis of Algorithms"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </div>

      {/* Modules */}
      <div className="card">
        <label className="form-label">Modules</label>
        <div className="modules-list">
          {modules.map((mod, idx) => (
            <div className="module-row" key={idx}>
              <span className="module-index">{String(idx + 1).padStart(2, "0")}</span>
              <input
                type="text"
                value={mod}
                onChange={(e) => updateModuleName(idx, e.target.value)}
                placeholder={`Module ${idx + 1} name`}
              />
              {modules.length > 1 && (
                <button className="btn-remove" onClick={() => removeModule(idx)}>×</button>
              )}
            </div>
          ))}
        </div>
        <button className="btn-add" onClick={addModule}>+ Add Module</button>
      </div>

      {/* Past Papers */}
      <div className="card">
        <label className="form-label">Past Papers — Common for all modules</label>
        <DropZone
          label="past papers"
          files={pastPapers}
          onChange={setPastPapers}
        />
        <p style={{ color: "var(--text-dimmer)", fontSize: "11px", marginTop: "10px" }}>
          Upload all past year papers. These apply across all modules.
        </p>
      </div>

      {/* Module Notes */}
      <div className="card">
        <label className="form-label">Module Notes — Per Module</label>
        <div className="module-notes-grid">
          {modules.map((mod, idx) => (
            <div className="module-notes-item" key={idx}>
              <div className="module-notes-label">{mod || `Module ${idx + 1}`}</div>
              <DropZone
                label={`notes for ${mod}`}
                files={moduleNotes[mod] || []}
                onChange={(files) => setNotesForModule(mod, files)}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        className="btn-predict"
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {loading ? "Predicting…" : "Generate Predictions →"}
      </button>
    </div>
  );
}
