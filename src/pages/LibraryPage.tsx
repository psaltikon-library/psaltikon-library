import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChantCard from "../components/ChantCard";
import UploadChantModal from "../components/UploadChantModal";
import { supabase } from "../lib/supabase";
import { Chant, Page } from "../types";
import { resolveChantsWithDevFallback } from "../utils/chantFallback";
import { isChantPublic } from "../utils/chantVisibility";
import { getSavedChantIds } from "../utils/savedChants";
import { compareFilterValues } from "../utils/filterOptions";
import { clearLibraryPreset, peekLibraryPreset } from "../utils/libraryPreset";
import { toneNumber } from "../utils/tones";

interface LibraryPageProps {
  onViewChant: (id: string) => void;
  onNavigate?: (page: Page) => void;
  bookletChantIds: string[];
  onToggleBookletChant: (chant: Chant) => void;
}

const buildFilterOptions = (chants: Chant[]) => {
  const getUniqueValues = (values: Array<string | null | undefined>, allLabel: string) => {
    const unique = Array.from(
      new Set(
        values
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean)
      )
    ).sort(compareFilterValues);

    return [allLabel, ...unique];
  };

  return {
    feasts: getUniqueValues(chants.map((chant) => chant.feast), "All Feasts"),
    services: getUniqueValues(chants.map((chant) => chant.service), "All Services"),
    parts: getUniqueValues(chants.map((chant) => chant.part), "All Parts"),
    tones: getUniqueValues(chants.map((chant) => chant.tone), "All Tones"),
    languages: getUniqueValues(chants.map((chant) => chant.language), "All Languages"),
    composers: getUniqueValues(chants.map((chant) => chant.composer), "All Composers"),
  };
};

const LibraryPage = ({ onViewChant, bookletChantIds, onToggleBookletChant }: LibraryPageProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingChant, setEditingChant] = useState<Chant | null>(null);
  const handleOpenUploadModal = () => {
    setEditingChant(null);
    setUploadModalOpen(true);
  };

  const handleEditChant = (chantId: string) => {
    const chantToEdit = chants.find((chant) => chant.id === chantId) || null;
    setEditingChant(chantToEdit);
    setUploadModalOpen(true);
  };
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [isHidingAll, setIsHidingAll] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const notificationTimerRef = useState<{ current: number | null }>({ current: null })[0];

  const [chants, setChants] = useState<Chant[]>([]);
  const [isLoadingChants, setIsLoadingChants] = useState(true);
  const [chantsError, setChantsError] = useState("");
  const [savedChantIds, setSavedChantIds] = useState<string[]>([]);

  // A search or tone chosen on the homepage (read once, cleared on mount).
  const [preset] = useState(peekLibraryPreset);
  useEffect(() => clearLibraryPreset, []);

  const [searchQuery, setSearchQuery] = useState(preset?.query ?? "");
  const [selectedFeast, setSelectedFeast] = useState("All Feasts");
  const [selectedService, setSelectedService] = useState("All Services");
  const [selectedPart, setSelectedPart] = useState("All Parts");
  const [selectedTone, setSelectedTone] = useState(preset?.tone ?? "All Tones");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [selectedComposer, setSelectedComposer] = useState("All Composers");

  const showNotification = (message: string) => {
    setNotificationMessage(message);

    if (notificationTimerRef.current) {
      window.clearTimeout(notificationTimerRef.current);
    }

    notificationTimerRef.current = window.setTimeout(() => {
      setNotificationMessage("");
      notificationTimerRef.current = null;
    }, 10000);
  };

  useEffect(() => {
    setIsAdmin(localStorage.getItem("psaltikon_admin_authed") === "true");

    const loadChants = async () => {
      setIsLoadingChants(true);
      setChantsError("");

      const { data, error } = await supabase
        .from("chants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setChants(resolveChantsWithDevFallback(null));
        setChantsError(import.meta.env.DEV ? "" : (error.message || "Failed to load chants."));
        setIsLoadingChants(false);
        return;
      }

      setChants(resolveChantsWithDevFallback(data as Chant[] | null));
      setIsLoadingChants(false);
    };

    void loadChants();
  }, []);

  useEffect(() => {
    const loadSavedChantIds = async () => {
      setSavedChantIds(await getSavedChantIds());
    };

    void loadSavedChantIds();
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        window.clearTimeout(notificationTimerRef.current);
      }
    };
  }, [notificationTimerRef]);

  const filterOptions = useMemo(() => buildFilterOptions(chants), [chants]);

  const filteredChants = chants.filter((chant: Chant) => {
    // Non-approved chants stay in the library for admins only.
    if (!isAdmin && !isChantPublic(chant)) return false;

    const query = searchQuery.toLowerCase();
    const englishTitle = (chant as any).english_title || (chant as any).englishTitle;
    const greekTitle = (chant as any).titleGreek || (chant as any).title_greek;

    const matchesSearch =
      chant.title.toLowerCase().includes(query) ||
      (typeof englishTitle === "string" && englishTitle.toLowerCase().includes(query)) ||
      (typeof greekTitle === "string" && greekTitle.toLowerCase().includes(query));

    const matchesFeast =
      selectedFeast === "All Feasts" || chant.feast === selectedFeast;
    const matchesService =
      selectedService === "All Services" || chant.service === selectedService;
    const matchesPart =
      selectedPart === "All Parts" || chant.part === selectedPart;
    // A plain "Tone 5" also takes in variants such as "Tone 5 (Friyos)".
    const matchesTone =
      selectedTone === "All Tones" ||
      chant.tone === selectedTone ||
      (/^Tone [1-8]$/.test(selectedTone) && toneNumber(chant.tone) === toneNumber(selectedTone));
    const matchesLanguage =
      selectedLanguage === "All Languages" || chant.language === selectedLanguage;
    const matchesComposer =
      selectedComposer === "All Composers" || chant.composer === selectedComposer;

    return (
      matchesSearch &&
      matchesFeast &&
      matchesService &&
      matchesPart &&
      matchesTone &&
      matchesLanguage &&
      matchesComposer
    );
  });

  const [filtersOpen, setFiltersOpen] = useState(false);

  const filterFields = [
    { id: "part", label: "Part of service", value: selectedPart, set: setSelectedPart, options: filterOptions.parts },
    { id: "tone", label: "Tone (echos)", value: selectedTone, set: setSelectedTone, options: filterOptions.tones },
    { id: "service", label: "Service", value: selectedService, set: setSelectedService, options: filterOptions.services },
    { id: "feast", label: "Feast", value: selectedFeast, set: setSelectedFeast, options: filterOptions.feasts },
    { id: "language", label: "Language", value: selectedLanguage, set: setSelectedLanguage, options: filterOptions.languages },
    { id: "composer", label: "Composer", value: selectedComposer, set: setSelectedComposer, options: filterOptions.composers },
  ];
  const activeFilterCount = filterFields.filter((field) => field.value !== field.options[0]).length;
  const hasAnyFilter = activeFilterCount > 0 || searchQuery.trim() !== "";

  const clearFilters = () => {
    setSelectedFeast("All Feasts");
    setSelectedService("All Services");
    setSelectedPart("All Parts");
    setSelectedTone("All Tones");
    setSelectedLanguage("All Languages");
    setSelectedComposer("All Composers");
    setSearchQuery("");
  };

  const handleApproveAll = async () => {
    const confirmed = window.confirm(
      "Approve all chants? This will mark every chant in the library as approved."
    );

    if (!confirmed) return;

    setIsApprovingAll(true);

    const { data, error } = await supabase
      .from("chants")
      .update({ status: "approved" })
      .neq("status", "approved")
      .select("*");

    if (error) {
      setIsApprovingAll(false);
      alert(error.message || "Failed to approve chants.");
      return;
    }

    setChants((current) => {
      if (!data || !data.length) return current;

      const approvedMap = new Map((data as Chant[]).map((chant) => [chant.id, chant]));
      return current.map((chant) => approvedMap.get(chant.id) || chant);
    });

    setIsApprovingAll(false);
    alert("All pending chants have been approved.");
  };

  const handleHideAll = async () => {
    const confirmed = window.confirm(
      "Hide all chants? This will mark every chant in the library as hidden."
    );

    if (!confirmed) return;

    setIsHidingAll(true);

    const { data, error } = await supabase
      .from("chants")
      .update({ status: "hidden" })
      .neq("status", "hidden")
      .select("*");

    if (error) {
      setIsHidingAll(false);
      alert(error.message || "Failed to hide chants.");
      return;
    }

    setChants((current) => {
      if (!data || !data.length) return current;

      const hiddenMap = new Map((data as Chant[]).map((chant) => [chant.id, chant]));
      return current.map((chant) => hiddenMap.get(chant.id) || chant);
    });

    setIsHidingAll(false);
    alert("All chants have been hidden.");
  };

  const handleDeleteChant = (chantId: string) => {
    setChants((current) => current.filter((chant) => chant.id !== chantId));
    showNotification("Chant deleted successfully.");
  };

  const handleSavedChant = (savedChant: Chant) => {
    const exists = chants.some((chant) => chant.id === savedChant.id);

    setChants((current) => {
      if (exists) {
        return current.map((chant) => (chant.id === savedChant.id ? savedChant : chant));
      }
      return [savedChant, ...current];
    });

    showNotification(exists ? "Chant updated successfully." : "Chant uploaded successfully.");
  };

  const handleSavedChantId = (chantId: string) => {
    setSavedChantIds((current) =>
      current.includes(chantId) ? current : [...current, chantId]
    );
  };

  const handleUnsavedChantId = (chantId: string) => {
    setSavedChantIds((current) => current.filter((id) => id !== chantId));
  };

  return (
    <>
      <AnimatePresence>
        {notificationMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: '1.25rem',
              right: '1.25rem',
              zIndex: 1100,
              maxWidth: '420px',
              width: 'calc(100vw - 2.5rem)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)',
              padding: '0.95rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                color: '#16a34a',
                fontSize: '0.95rem',
              }}
            >
              ✓
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  lineHeight: 1.25,
                }}
              >
                Success
              </div>
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  marginTop: '0.15rem',
                }}
              >
                {notificationMessage}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setNotificationMessage("");
                if (notificationTimerRef.current) {
                  window.clearTimeout(notificationTimerRef.current);
                  notificationTimerRef.current = null;
                }
              }}
              aria-label="Dismiss notification"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
                padding: '0.1rem',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="library-page">
        <header className="library-head">
          <div>
            <h1 className="library-title">Chant library</h1>
            <p className="library-count" aria-live="polite">
              Showing {filteredChants.length} of {chants.length} chants
            </p>
          </div>

          {isAdmin && (
            <div className="library-admin">
              <button className="btn btn-primary" onClick={handleOpenUploadModal}>
                Upload a Chant
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => void handleApproveAll()}
                disabled={isApprovingAll}
              >
                {isApprovingAll ? "Approving..." : "Approve All"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => void handleHideAll()}
                disabled={isHidingAll}
              >
                {isHidingAll ? "Hiding..." : "Hide All"}
              </button>
            </div>
          )}
        </header>

        <section className="library-filters" aria-label="Search and filters">
          <div className="library-filters__top">
            <div className="library-search" role="search">
              <label className="library-search__label" htmlFor="library-search-input">
                Search chants
              </label>
              <input
                id="library-search-input"
                type="search"
                className="library-search__input"
                placeholder="Search by title"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="library-filters__toggle"
              aria-expanded={filtersOpen}
              aria-controls="library-filter-panel"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              Filters
              {activeFilterCount > 0 && <span className="library-filters__badge">{activeFilterCount}</span>}
              <svg className="library-filters__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {activeFilterCount > 0 && !filtersOpen && (
              <p className="library-filters__summary">
                {filterFields
                  .filter((field) => field.value !== field.options[0])
                  .map((field) => field.value)
                  .join(" \u00b7 ")}
              </p>
            )}

            {hasAnyFilter && (
              <button type="button" className="home-link library-filters__clear" onClick={clearFilters}>
                Clear all
              </button>
            )}
          </div>

          <div
            id="library-filter-panel"
            className={`library-filters__panel ${filtersOpen ? "is-open" : ""}`}
          >
          <div className="library-filters__grid">
            {filterFields.map((field) => (
              <div className="library-field" key={field.id}>
                <label className="library-field__label" htmlFor={`library-filter-${field.id}`}>
                  {field.label}
                </label>
                <select
                  id={`library-filter-${field.id}`}
                  className="library-field__select"
                  data-active={field.value !== field.options[0] || undefined}
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          </div>
        </section>

        <div>
          <AnimatePresence mode="wait">
            {isLoadingChants ? (
              <motion.div
                key="chants-loading"
                className="library-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                aria-busy="true"
              >
                <h2 className="library-state__title">Loading chants</h2>
                <p className="library-state__text">Pulling chant records from the library.</p>
              </motion.div>
            ) : chantsError ? (
              <motion.div
                key="chants-error"
                className="library-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role="alert"
              >
                <h2 className="library-state__title">Could not load chants</h2>
                <p className="library-state__text">{chantsError}</p>
              </motion.div>
            ) : filteredChants.length > 0 ? (
              <motion.div
                key="chants-grid"
                className="chants-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredChants.map((chant: Chant, index: number) => (
                  <ChantCard
                    key={chant.id}
                    chant={chant}
                    onView={onViewChant}
                    onEdit={handleEditChant}
                    onDelete={handleDeleteChant}
                    isSaved={savedChantIds.includes(chant.id)}
                    onSave={handleSavedChantId}
                    onUnsave={handleUnsavedChantId}
                    showSaveButton={true}
                    index={index}
                    onToggleBooklet={(id) => {
                      const target = chants.find((item) => item.id === id);
                      if (target) onToggleBookletChant(target);
                    }}
                    isInBooklet={bookletChantIds.includes(chant.id)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="chants-empty"
                className="library-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="library-state__title">No chants found</h2>
                <p className="library-state__text">Try fewer filters or a different search.</p>
                <button type="button" className="home-link" onClick={clearFilters}>
                  Clear all filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <UploadChantModal
        open={uploadModalOpen}
        initialChant={editingChant}
        onClose={() => {
          setUploadModalOpen(false);
          setEditingChant(null);
        }}
        onSaved={handleSavedChant}
      />
    </>
  );
};

export default LibraryPage;