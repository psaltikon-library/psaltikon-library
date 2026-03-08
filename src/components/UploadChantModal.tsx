import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../lib/supabase";

type UploadChantModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function UploadChantModal({
  open,
  onClose,
}: UploadChantModalProps) {
  const [title, setTitle] = useState("");
  const [feast, setFeast] = useState("");
  const [service, setService] = useState("");
  const [part, setPart] = useState("");
  const [tone, setTone] = useState("");
  const [language, setLanguage] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setTitle("");
    setFeast("");
    setService("");
    setPart("");
    setTone("");
    setLanguage("");
    setPdfFile(null);
    setIsSubmitting(false);
  };
  const buildPdfPath = (file: File, chantTitle: string) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const safeTitle = chantTitle
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const uniqueId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    return `chants/${uniqueId}-${safeTitle || "untitled"}.${extension}`;
  };

  const applyPdfFile = (file: File | null) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file only.");
      return;
    }

    setPdfFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    applyPdfFile(e.dataTransfer.files?.[0] || null);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      setIsDragOver(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      alert("Please enter a chant title.");
      return;
    }

    if (!pdfFile) {
      alert("Please upload a PDF file.");
      return;
    }

    setIsSubmitting(true);

    const pdfPath = buildPdfPath(pdfFile, trimmedTitle);

    const { error: uploadError } = await supabase.storage
      .from("chant-pdfs")
      .upload(pdfPath, pdfFile, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      setIsSubmitting(false);
      alert(uploadError.message || "Failed to upload PDF.");
      return;
    }

    const payload = {
      title: trimmedTitle,
      english_title: null,
      tone: tone || null,
      feast: feast || null,
      service: service || null,
      part: part || null,
      language: language || null,
      composer: null,
      pdf_path: pdfPath,
      has_phonetics: false,
      phonetics_text: null,
    };

    const { error: insertError } = await supabase.from("chants").insert(payload);

    if (insertError) {
      await supabase.storage.from("chant-pdfs").remove([pdfPath]);
      setIsSubmitting(false);
      alert(insertError.message || "Failed to save chant data.");
      return;
    }

    alert("Chant uploaded successfully.");
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="auth-modal-overlay auth-modal-overlay--signup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="auth-modal-backdrop"
            onClick={onClose}
            aria-label="Close upload modal"
          />

          <motion.div
            className="auth-modal auth-modal--signup"
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="auth-modal-header">
              <div className="auth-modal-brand">
                <div className="auth-modal-icon">☦</div>
                <div>
                  <div className="auth-modal-app">Psaltikon Admin</div>
                  <div className="auth-modal-title">Upload a Chant</div>
                  <div className="auth-modal-subtitle">
                    Add chant metadata and upload its PDF.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="auth-modal-close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form className="auth-modal-body upload-chant-form" onSubmit={handleSubmit}>
              <div className="auth-field upload-chant-form__title">
                <label className="auth-label">Chant Title *</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Enter chant title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="upload-chant-form__content">
                <div className="upload-chant-form__fields">
                  <div className="auth-field">
                    <label className="auth-label">Feast</label>
                    <select
                      className="auth-input"
                      value={feast}
                      onChange={(e) => setFeast(e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Pascha">Pascha</option>
                      <option value="Nativity">Nativity</option>
                      <option value="Theophany">Theophany</option>
                      <option value="Pentecost">Pentecost</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Service</label>
                    <select
                      className="auth-input"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Divine Liturgy">Divine Liturgy</option>
                      <option value="Matins">Matins</option>
                      <option value="Vespers">Vespers</option>
                      <option value="Orthros">Orthros</option>
                      <option value="Compline">Compline</option>
                    </select>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Part of Service</label>
                    <select
                      className="auth-input"
                      value={part}
                      onChange={(e) => setPart(e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Apolytikion">Apolytikion</option>
                      <option value="Troparion">Troparion</option>
                      <option value="Kontakion">Kontakion</option>
                      <option value="Cherubikon">Cherubikon</option>
                      <option value="Doxology">Doxology</option>
                    </select>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Tone (Echos)</label>
                    <select
                      className="auth-input"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Tone 1">Tone 1</option>
                      <option value="Tone 2">Tone 2</option>
                      <option value="Tone 3">Tone 3</option>
                      <option value="Tone 4">Tone 4</option>
                      <option value="Tone 5">Tone 5</option>
                      <option value="Tone 6">Tone 6</option>
                      <option value="Tone 7">Tone 7</option>
                      <option value="Tone 8">Tone 8</option>
                    </select>
                  </div>

                  <div className="auth-field upload-chant-form__field--full">
                    <label className="auth-label">Language</label>
                    <select
                      className="auth-input"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="">None</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Arabic Phonetics">Arabic Phonetics</option>
                      <option value="Greek">Greek</option>
                      <option value="Greek Phonetics">Greek Phonetics</option>
                      <option value="English">English</option>
                      <option value="French">French</option>
                    </select>
                  </div>
                </div>

                <div className="auth-field upload-chant-form__upload-field">
                  <label className="auth-label">Upload PDF *</label>
                  <div
                    className={`upload-dropzone${isDragOver ? " is-dragover" : ""}${pdfFile ? " has-file" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      className="upload-dropzone__input"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => applyPdfFile(e.target.files?.[0] || null)}
                    />

                    <div className="upload-dropzone__icon">⇪</div>
                    <div className="upload-dropzone__title">
                      {pdfFile ? pdfFile.name : "Drag & drop a PDF here"}
                    </div>
                    <div className="upload-dropzone__subtitle">
                      {pdfFile
                        ? "PDF selected. Click to replace it."
                        : "or click to browse your files"}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit upload-chant-form__submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Uploading..." : "Upload Chant"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}