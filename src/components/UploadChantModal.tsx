import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import {
  DEFAULT_FILTER_OPTIONS,
  FilterCategory,
  loadFilterValues,
} from "../utils/filterOptions";
import {
  ChantPdfRow,
  addChantPdfs,
  deleteChantPdfs,
  labelFromFileName,
  loadChantPdfs,
  updateChantPdfLabels,
} from "../utils/chantPdfs";
import { loadComposers } from "../utils/composers";
import { CHURCH_BOOKS, MENAION_MONTHS, SECTIONS_BY_BOOK } from "../utils/churchBooks";

// Ensure a select can still display a stored value that is no longer an option.
const withCurrent = (values: string[], current: string) =>
  current && !values.includes(current) ? [current, ...values] : values;

type UploadChantModalProps = {
  open: boolean;
  onClose: () => void;
  initialChant?: any | null;
  onSaved?: (chant: any) => void;
};

export default function UploadChantModal({
  open,
  onClose,
  initialChant = null,
  onSaved,
}: UploadChantModalProps) {
  const [title, setTitle] = useState("");
  const [feast, setFeast] = useState("");
  const [service, setService] = useState("");
  const [part, setPart] = useState("");
  const [tone, setTone] = useState("");
  const [language, setLanguage] = useState("");
  const [composer, setComposer] = useState("");
  const [book, setBook] = useState("");
  const [psalmNumber, setPsalmNumber] = useState("");
  const [menaionMonth, setMenaionMonth] = useState("");
  const [menaionDay, setMenaionDay] = useState("");
  const [weekTheme, setWeekTheme] = useState("");
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [existingPdfs, setExistingPdfs] = useState<ChantPdfRow[]>([]);
  const [removedPdfIds, setRemovedPdfIds] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterValues, setFilterValues] =
    useState<Record<FilterCategory, string[]>>(DEFAULT_FILTER_OPTIONS);
  const [composers, setComposers] = useState<string[]>([]);
  // Editable PDF display names, keyed by existing row id / by "name:size" for new files.
  const [existingLabels, setExistingLabels] = useState<Record<string, string>>({});
  const [newLabels, setNewLabels] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fileKey = (file: File) => `${file.name}:${file.size}`;

  const isEditing = !!initialChant?.id;
  const keptPdfs = existingPdfs.filter((row) => !removedPdfIds.includes(row.id));
  const totalPdfCount = keptPdfs.length + pdfFiles.length;

  const resetForm = () => {
    setTitle(initialChant?.title || "");
    setFeast(initialChant?.feast || "");
    setService(initialChant?.service || "");
    setPart(initialChant?.part || "");
    setTone(initialChant?.tone || "");
    setLanguage(initialChant?.language || "");
    setComposer(initialChant?.composer || "");
    setBook(initialChant?.book || "");
    setPsalmNumber(
      initialChant?.psalm_number != null ? String(initialChant.psalm_number) : ""
    );
    setMenaionMonth(initialChant?.menaion_month || "");
    setMenaionDay(initialChant?.menaion_day != null ? String(initialChant.menaion_day) : "");
    setWeekTheme(initialChant?.week_theme || "");
    setPdfFiles([]);
    setExistingPdfs([]);
    setRemovedPdfIds([]);
    setNewLabels({});
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

  const applyPdfFiles = (files: FileList | File[] | null) => {
    if (!files) return;

    const incoming = Array.from(files);
    const pdfs = incoming.filter((file) => file.type === "application/pdf");

    if (pdfs.length < incoming.length) {
      alert("Only PDF files can be added. Non-PDF files were skipped.");
    }

    if (!pdfs.length) return;

    setPdfFiles((current) => {
      const seen = new Set(current.map((file) => `${file.name}:${file.size}`));
      const additions = pdfs.filter((file) => !seen.has(`${file.name}:${file.size}`));
      setNewLabels((labels) => {
        const next = { ...labels };
        additions.forEach((file) => {
          const key = `${file.name}:${file.size}`;
          if (!(key in next)) next[key] = labelFromFileName(file.name);
        });
        return next;
      });
      return [...current, ...additions];
    });
  };

  const removePendingFile = (index: number) => {
    setPdfFiles((current) => current.filter((_, i) => i !== index));
  };

  const toggleExistingPdfRemoval = (id: string) => {
    setRemovedPdfIds((current) =>
      current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id]
    );
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
    applyPdfFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      setIsDragOver(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [open, initialChant]);

  useEffect(() => {
    if (!open) return;

    let isActive = true;
    void loadFilterValues().then((values) => {
      if (isActive) setFilterValues(values);
    });

    return () => {
      isActive = false;
    };
  }, [open]);

  // Dynamic composer suggestions built from composers already used on chants.
  useEffect(() => {
    if (!open) return;
    let isActive = true;
    void loadComposers().then((list) => {
      if (isActive) setComposers(list);
    });
    return () => {
      isActive = false;
    };
  }, [open]);

  // Seed the editable name for each existing PDF whenever the list (re)loads.
  useEffect(() => {
    setExistingLabels(
      Object.fromEntries(
        existingPdfs.map((row) => [row.id, row.label || row.pdf_path.split("/").pop() || ""])
      )
    );
  }, [existingPdfs]);

  // Load the chant's existing PDFs when editing. Falls back to the chant's own
  // pdf_path when the chant_pdfs table is unavailable or has no rows yet.
  useEffect(() => {
    if (!open || !initialChant?.id) return;

    let isActive = true;

    const load = async () => {
      try {
        const rows = await loadChantPdfs(initialChant.id);
        if (!isActive) return;

        if (rows.length > 0) {
          setExistingPdfs(rows);
          return;
        }
      } catch {
        // fall through to the single-path fallback below
      }

      if (!isActive) return;

      const legacyPath = initialChant?.pdf_path;
      setExistingPdfs(
        legacyPath
          ? [
              {
                id: `legacy:${legacyPath}`,
                chant_id: initialChant.id,
                pdf_path: legacyPath,
                label: null,
                sort_order: 0,
              },
            ]
          : []
      );
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [open, initialChant]);

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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You must be logged in to manage a chant.");
      return;
    }

    if (totalPdfCount === 0) {
      alert("Please add at least one PDF.");
      return;
    }

    setIsSubmitting(true);

    // Upload every newly added PDF; roll them back if anything later fails.
    const uploadedPaths: string[] = [];

    for (const file of pdfFiles) {
      const path = buildPdfPath(file, trimmedTitle);

      const { error: uploadError } = await supabase.storage
        .from("chant-pdfs")
        .upload(path, file, { contentType: "application/pdf", upsert: false });

      if (uploadError) {
        if (uploadedPaths.length) {
          await supabase.storage.from("chant-pdfs").remove(uploadedPaths);
        }
        setIsSubmitting(false);
        alert(uploadError.message || "Failed to upload PDF.");
        return;
      }

      uploadedPaths.push(path);
    }

    const rollbackUploads = async () => {
      if (uploadedPaths.length) {
        await supabase.storage.from("chant-pdfs").remove(uploadedPaths);
      }
    };

    // The first remaining PDF stays on chants.pdf_path so booklets and older
    // clients keep working.
    const primaryPdfPath = keptPdfs[0]?.pdf_path || uploadedPaths[0] || null;

    const payload = {
      title: trimmedTitle,
      english_title: initialChant?.english_title || null,
      tone: tone || null,
      feast: feast || null,
      service: service || null,
      part: part || null,
      language: language || null,
      composer: composer.trim() || null,
      book: book || null,
      // Only the book that uses each ordering field keeps its value.
      psalm_number: book === "Psalter" && psalmNumber ? Number(psalmNumber) : null,
      menaion_month: book === "Menaion" ? menaionMonth || null : null,
      menaion_day: book === "Menaion" && menaionDay ? Number(menaionDay) : null,
      week_theme: SECTIONS_BY_BOOK[book] ? weekTheme.trim() || null : null,
      pdf_path: primaryPdfPath,
      uploaded_by: initialChant?.uploaded_by || user.id,
      status: initialChant?.status || "pending",
    };

    const nextSortOrderStart =
      keptPdfs.reduce((max, row) => Math.max(max, row.sort_order), -1) + 1;

    if (isEditing) {
      const { data, error } = await supabase
        .from("chants")
        .update(payload)
        .eq("id", initialChant.id)
        .select("*")
        .single();

      if (error) {
        await rollbackUploads();
        setIsSubmitting(false);
        alert(error.message || "Failed to update chant.");
        return;
      }

      if (uploadedPaths.length) {
        try {
          await addChantPdfs(
            uploadedPaths.map((path, index) => ({
              chant_id: initialChant.id,
              pdf_path: path,
              label:
                newLabels[fileKey(pdfFiles[index])]?.trim() ||
                labelFromFileName(pdfFiles[index]?.name || ""),
              sort_order: nextSortOrderStart + index,
            }))
          );
        } catch (pdfError) {
          await rollbackUploads();
          setIsSubmitting(false);
          alert(
            pdfError instanceof Error
              ? `${pdfError.message} (Has the 20260730 chant PDFs migration been run in Supabase?)`
              : "Failed to register chant PDFs."
          );
          return;
        }
      }

      // Remove the PDFs the admin unchecked: storage objects first, then rows.
      const removedRows = existingPdfs.filter((row) => removedPdfIds.includes(row.id));

      if (removedRows.length) {
        await supabase.storage
          .from("chant-pdfs")
          .remove(removedRows.map((row) => row.pdf_path));

        const realIds = removedRows
          .filter((row) => !row.id.startsWith("legacy:"))
          .map((row) => row.id);

        try {
          await deleteChantPdfs(realIds);
        } catch (deleteError) {
          alert(
            deleteError instanceof Error
              ? deleteError.message
              : "Some PDFs could not be removed."
          );
        }
      }

      // Persist any renamed existing PDFs (legacy rows have no real id to update).
      const labelUpdates = keptPdfs
        .filter((row) => !row.id.startsWith("legacy:"))
        .filter((row) => (existingLabels[row.id] ?? "").trim() !== (row.label || "").trim())
        .map((row) => ({ id: row.id, label: existingLabels[row.id] ?? "" }));

      if (labelUpdates.length) {
        try {
          await updateChantPdfLabels(labelUpdates);
        } catch (labelError) {
          alert(
            labelError instanceof Error ? labelError.message : "Some PDF names could not be saved."
          );
        }
      }

      onSaved?.(data);
      setIsSubmitting(false);
      setPdfFiles([]);
      onClose();
      return;
    }

    const { data, error: insertError } = await supabase
      .from("chants")
      .insert(payload)
      .select("*")
      .single();

    if (insertError) {
      await rollbackUploads();
      setIsSubmitting(false);
      alert(insertError.message || "Failed to save chant data.");
      return;
    }

    try {
      await addChantPdfs(
        uploadedPaths.map((path, index) => ({
          chant_id: data.id,
          pdf_path: path,
          label:
            newLabels[fileKey(pdfFiles[index])]?.trim() ||
            labelFromFileName(pdfFiles[index]?.name || ""),
          sort_order: index,
        }))
      );
    } catch (pdfError) {
      // The chant row itself saved with its primary PDF, so keep it and warn.
      alert(
        pdfError instanceof Error
          ? `Chant saved, but the additional PDFs could not be registered: ${pdfError.message} (Has the 20260730 chant PDFs migration been run in Supabase?)`
          : "Chant saved, but the additional PDFs could not be registered."
      );
    }

    onSaved?.(data);
    setIsSubmitting(false);
    setPdfFiles([]);
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
                  <div className="auth-modal-title">{isEditing ? "Edit Chant" : "Upload a Chant"}</div>
                  <div className="auth-modal-subtitle">
                    {isEditing
                      ? "Update chant metadata and manage its PDFs."
                      : "Add chant metadata and upload one or more PDFs."}
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
                    <label className="auth-label">Part of Service</label>
                    <select
                      className="auth-input"
                      value={part}
                      onChange={(e) => setPart(e.target.value)}
                    >
                      <option value="">None</option>
                      {withCurrent(filterValues.part, part).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
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
                      {withCurrent(filterValues.tone, tone).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
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
                      {withCurrent(filterValues.service, service).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Feast</label>
                    <select
                      className="auth-input"
                      value={feast}
                      onChange={(e) => setFeast(e.target.value)}
                    >
                      <option value="">None</option>
                      {withCurrent(filterValues.feast, feast).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
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
                      {withCurrent(filterValues.language, language).map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field upload-chant-form__field--full">
                    <label className="auth-label">Composer</label>
                    <input
                      className="auth-input"
                      type="text"
                      list="composer-options"
                      placeholder="Type a composer name"
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                    />
                    <datalist id="composer-options">
                      {composers.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="auth-field upload-chant-form__field--full">
                    <label className="auth-label">Church Book</label>
                    <select
                      className="auth-input"
                      value={book}
                      onChange={(e) => setBook(e.target.value)}
                    >
                      <option value="">None</option>
                      {CHURCH_BOOKS.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  {SECTIONS_BY_BOOK[book] && (
                    <div className="auth-field upload-chant-form__field--full">
                      <label className="auth-label">Week / Section</label>
                      <input
                        className="auth-input"
                        type="text"
                        list="week-theme-options"
                        placeholder="e.g. Sunday of Orthodoxy"
                        value={weekTheme}
                        onChange={(e) => setWeekTheme(e.target.value)}
                      />
                      <datalist id="week-theme-options">
                        {(SECTIONS_BY_BOOK[book] || []).map((value) => (
                          <option key={value} value={value} />
                        ))}
                      </datalist>
                    </div>
                  )}

                  {book === "Psalter" && (
                    <div className="auth-field upload-chant-form__field--full">
                      <label className="auth-label">Psalm Number</label>
                      <input
                        className="auth-input"
                        type="number"
                        min={1}
                        max={151}
                        placeholder="e.g. 103"
                        value={psalmNumber}
                        onChange={(e) => setPsalmNumber(e.target.value)}
                      />
                    </div>
                  )}

                  {book === "Menaion" && (
                    <>
                      <div className="auth-field">
                        <label className="auth-label">Month</label>
                        <select
                          className="auth-input"
                          value={menaionMonth}
                          onChange={(e) => setMenaionMonth(e.target.value)}
                        >
                          <option value="">None</option>
                          {MENAION_MONTHS.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>

                      <div className="auth-field">
                        <label className="auth-label">Day</label>
                        <input
                          className="auth-input"
                          type="number"
                          min={1}
                          max={31}
                          placeholder="e.g. 15"
                          value={menaionDay}
                          onChange={(e) => setMenaionDay(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="upload-chant-form__upload-field">
                  <div className="auth-field">
                    <label className="auth-label">
                      {isEditing ? "PDFs" : "Upload PDFs *"}
                    </label>

                    {(keptPdfs.length > 0 || removedPdfIds.length > 0 || pdfFiles.length > 0) && (
                      <div className="chant-pdf-list">
                        {existingPdfs.map((row) => {
                          const isRemoved = removedPdfIds.includes(row.id);
                          return (
                            <div
                              key={row.id}
                              className={`chant-pdf-item${isRemoved ? " is-removed" : ""}`}
                            >
                              <input
                                className="chant-pdf-item__name-input"
                                value={existingLabels[row.id] ?? ""}
                                onChange={(e) =>
                                  setExistingLabels((labels) => ({
                                    ...labels,
                                    [row.id]: e.target.value,
                                  }))
                                }
                                disabled={isRemoved}
                                placeholder="PDF name"
                                aria-label="PDF name"
                              />
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => toggleExistingPdfRemoval(row.id)}
                              >
                                {isRemoved ? "Undo" : "Remove"}
                              </button>
                            </div>
                          );
                        })}

                        {pdfFiles.map((file, index) => (
                          <div className="chant-pdf-item is-new" key={`${file.name}-${file.size}-${index}`}>
                            <span className="chant-pdf-item__name">
                              <input
                                className="chant-pdf-item__name-input"
                                value={newLabels[fileKey(file)] ?? labelFromFileName(file.name)}
                                onChange={(e) =>
                                  setNewLabels((labels) => ({
                                    ...labels,
                                    [fileKey(file)]: e.target.value,
                                  }))
                                }
                                placeholder="PDF name"
                                aria-label="PDF name"
                              />
                              <span className="chant-pdf-item__tag">New</span>
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => removePendingFile(index)}
                              aria-label={`Remove ${file.name}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className={`upload-dropzone${isDragOver ? " is-dragover" : ""}${totalPdfCount > 0 ? " has-file" : ""}`}
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
                        multiple
                        onChange={(e) => {
                          applyPdfFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />

                      <div className="upload-dropzone__icon">⇪</div>
                      <div className="upload-dropzone__title">
                        {totalPdfCount > 0
                          ? `${totalPdfCount} PDF${totalPdfCount === 1 ? "" : "s"} attached — add more`
                          : "Drag & drop PDFs here"}
                      </div>
                      <div className="upload-dropzone__subtitle">
                        You can select several files at once. The first PDF is used as the chant's
                        primary score.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit upload-chant-form__submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Uploading..."
                  : isEditing
                    ? "Update Chant"
                    : "Upload Chant"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
