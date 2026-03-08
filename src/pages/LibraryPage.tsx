import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChantCard from "../components/ChantCard";
import UploadChantModal from "../components/UploadChantModal";
import { supabase } from "../lib/supabase";
import { Chant } from "../types";

interface LibraryPageProps {
  onViewChant: (id: string) => void;
}

const buildFilterOptions = (chants: Chant[]) => {
  const getUniqueValues = (values: Array<string | null | undefined>, allLabel: string) => {
    const unique = Array.from(
      new Set(
        values
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    return [allLabel, ...unique];
  };

  return {
    feasts: getUniqueValues(chants.map((chant) => chant.feast), "All Feasts"),
    services: getUniqueValues(chants.map((chant) => chant.service), "All Services"),
    parts: getUniqueValues(chants.map((chant) => chant.part), "All Parts"),
    tones: getUniqueValues(chants.map((chant) => chant.tone), "All Tones"),
    languages: getUniqueValues(chants.map((chant) => chant.language), "All Languages"),
  };
};

const LibraryPage = ({ onViewChant }: LibraryPageProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [chants, setChants] = useState<Chant[]>([]);
  const [isLoadingChants, setIsLoadingChants] = useState(true);
  const [chantsError, setChantsError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeast, setSelectedFeast] = useState("All Feasts");
  const [selectedService, setSelectedService] = useState("All Services");
  const [selectedPart, setSelectedPart] = useState("All Parts");
  const [selectedTone, setSelectedTone] = useState("All Tones");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");

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
        setChants([]);
        setChantsError(error.message || "Failed to load chants.");
        setIsLoadingChants(false);
        return;
      }

      setChants((data as Chant[]) || []);
      setIsLoadingChants(false);
    };

    void loadChants();
  }, []);

  const filterOptions = useMemo(() => buildFilterOptions(chants), [chants]);

  const filteredChants = chants.filter((chant: Chant) => {
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
    const matchesTone =
      selectedTone === "All Tones" || chant.tone === selectedTone;
    const matchesLanguage =
      selectedLanguage === "All Languages" || chant.language === selectedLanguage;

    return (
      matchesSearch &&
      matchesFeast &&
      matchesService &&
      matchesPart &&
      matchesTone &&
      matchesLanguage
    );
  });

  const clearFilters = () => {
    setSelectedFeast("All Feasts");
    setSelectedService("All Services");
    setSelectedPart("All Parts");
    setSelectedTone("All Tones");
    setSelectedLanguage("All Languages");
    setSearchQuery("");
  };

  return (
    <>
      <div className="page-with-sidebar">
        {/* Sidebar */}
        <motion.aside
          className="sidebar"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="sidebar-header">
            <h3 className="sidebar-title">☦ Filters</h3>
            <motion.button
              className="btn btn-ghost btn-sm"
              onClick={clearFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear All
            </motion.button>
          </div>

          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search chants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <motion.div
            className="filter-group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="filter-label">Feast</label>
            <select
              className="filter-select"
              value={selectedFeast}
              onChange={(e) => setSelectedFeast(e.target.value)}
            >
              {filterOptions.feasts.map((feast) => (
                <option key={feast} value={feast}>
                  {feast}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div
            className="filter-group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className="filter-label">Service</label>
            <select
              className="filter-select"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              {filterOptions.services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div
            className="filter-group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="filter-label">Part of Service</label>
            <select
              className="filter-select"
              value={selectedPart}
              onChange={(e) => setSelectedPart(e.target.value)}
            >
              {filterOptions.parts.map((part) => (
                <option key={part} value={part}>
                  {part}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div
            className="filter-group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="filter-label">Tone (Echos)</label>
            <select
              className="filter-select"
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
            >
              {filterOptions.tones.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div
            className="filter-group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="filter-label">Language</label>
            <select
              className="filter-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {filterOptions.languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Booklet Builder Preview */}
          <motion.div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background:
                "linear-gradient(135deg, rgba(139, 38, 53, 0.05), rgba(201, 162, 39, 0.05))",
              borderRadius: "12px",
              border: "1px dashed var(--border)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h4
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.85rem",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              📚 Booklet Builder
              <span className="coming-soon-badge">Soon</span>
            </h4>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
              }}
            >
              Select chants to create a custom service booklet
            </p>
            <motion.button
              className="btn btn-secondary btn-sm"
              style={{ width: "100%" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => alert("Booklet Builder coming soon!")}
            >
              0 chants selected
            </motion.button>
          </motion.div>
        </motion.aside>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="chants-header">
            <div>
              <motion.h1
                style={{ fontSize: "2rem", marginBottom: "0.5rem" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Chant Library
              </motion.h1>

              <p className="chants-count">
                Showing {filteredChants.length} of {chants.length} chants
              </p>

              {isAdmin && (
                <motion.div
                  style={{ marginTop: "1rem" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <motion.button
                    className="btn btn-primary"
                    onClick={() => setUploadModalOpen(true)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Upload a Chant
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLoadingChants ? (
              <motion.div
                key="chants-loading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  textAlign: "center",
                  padding: "4rem 2rem",
                  background: "var(--bg-surface)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    fontSize: "2.5rem",
                    marginBottom: "1rem",
                    opacity: 0.35,
                  }}
                >
                  ⏳
                </div>
                <h3 style={{ marginBottom: "0.5rem" }}>Loading chants...</h3>
                <p style={{ color: "var(--text-muted)" }}>
                  Pulling chant records from the library database.
                </p>
              </motion.div>
            ) : chantsError ? (
              <motion.div
                key="chants-error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  textAlign: "center",
                  padding: "4rem 2rem",
                  background: "var(--bg-surface)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    fontSize: "2.5rem",
                    marginBottom: "1rem",
                    opacity: 0.35,
                  }}
                >
                  ⚠️
                </div>
                <h3 style={{ marginBottom: "0.5rem" }}>Could not load chants</h3>
                <p style={{ color: "var(--text-muted)" }}>{chantsError}</p>
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
                    index={index}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="chants-empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  textAlign: "center",
                  padding: "4rem 2rem",
                  background: "var(--bg-surface)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div
                  style={{
                    fontSize: "3rem",
                    marginBottom: "1rem",
                    opacity: 0.3,
                  }}
                >
                  🔍
                </div>
                <h3 style={{ marginBottom: "0.5rem" }}>No chants found</h3>
                <p style={{ color: "var(--text-muted)" }}>
                  Try adjusting your filters or search terms
                </p>
                <motion.button
                  className="btn btn-secondary"
                  style={{ marginTop: "1.5rem" }}
                  onClick={clearFilters}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear Filters
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <UploadChantModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
    </>
  );
};

export default LibraryPage;