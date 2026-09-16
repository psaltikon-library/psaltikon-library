# Psaltikon Library — Development Handoff

## Project Overview

**Psaltikon Library** is a full-stack Byzantine chant repository built with React, TypeScript, Supabase, and pdf-lib. It provides:
- Searchable chant library with multiple filter dimensions (tone, service, part, language, feast, etc.)
- User authentication and saved chants
- Chant submission & admin approval workflow
- Booklet builder that compiles chants into branded PDFs
- Auto-stamped PDF headers/footers with editable per-chant overrides
- Phonetic transliterations for Arabic/Greek chants

**Live:** [psaltikonlibrary.ca](https://psaltikonlibrary.ca) (Vercel)  
**Repo:** [psaltikon-library/psaltikon-library](https://github.com/psaltikon-library/psaltikon-library)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4, custom CSS |
| Animations | Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| PDF Handling | pdf-lib (generation), react-pdf (viewing) |
| Deployment | Vercel |

**Key dependencies:**
- `@supabase/supabase-js` for DB & auth
- `pdf-lib` for stamping headers/footers
- `react-pdf` for displaying PDFs in the viewer
- `framer-motion` for page transitions and UI animations

---

## Recent Work (Last Session)

### Completed Features
1. **PDF Header/Footer System** (commits 9024d18–c3c3152)
   - Auto-derived headers: "Service/Book - Feast - Chant type"
   - Auto-derived footers: composer credit + phonetics (Arabic/Greek only)
   - Per-chant override fields in edit modal: `pdf_header`, `pdf_credit`, `pdf_phonetics`
   - Burgundy rules with gold underlines, clickable mailto link on email
   - Migration: `supabase/migrations/20260914_pdf_header_footer.sql`

2. **Booklet UI Overhaul** (commits e86e057–0e4b170)
   - Floating bubble docked at top-right, minimizable to navbar icon
   - Shared state across pages (lifted to App.tsx)
   - Smooth Framer Motion animations, responsive layout

3. **Favicon & Branding** (commits b299ec4–7e4bcc3)
   - Three-bar Orthodox cross logo (burgundy + gold) as favicon
   - PNG rasterized fallbacks for older browsers
   - Static HTML loader for slow boots

4. **Accessibility & UX** (commit 61e5eb2)
   - Fixed edit modal scrolling (overflow-y: auto)

### Current State
- ✅ All PDF stamping working end-to-end
- ✅ Booklet builder operational with minimization
- ✅ Admin can edit chant headers/footers per submission
- ✅ Resume updated with Psaltikon Library project

---

## Key Files & Architecture

### Core App Structure
- **src/App.tsx** — Main router, booklet state management (lifted), page rendering
- **src/components/Header.tsx** — Nav bar with booklet button when minimized
- **src/index.css** — All styling (Tailwind + custom CSS for modals, cards, animations)

### Pages
- **src/pages/HomePage.tsx** — Featured chants, hero section
- **src/pages/LibraryPage.tsx** — Full chant search + filters
- **src/pages/ChantDetailPage.tsx** — Single chant viewer, PDF display with auto-stamping
- **src/pages/AdminPage.tsx** — Chant submission queue, status updates

### Modals & Components
- **src/components/UploadChantModal.tsx** — Edit/upload form with PDF customization fields
- **src/components/BookletBuilderModal.tsx** — Chant selection → PDF compilation
- **src/components/AuthModal.tsx** — Login/signup

### Utilities
- **src/utils/pdfStamp.ts** — PDF header/footer generation
  - `headerLine(chant)` — Derives "Service - Feast - Type" (respects pdf_header override)
  - `composerCredit(chant)` — Footer credit (respects pdf_credit override)
  - `phoneticsCredit(chant)` — Auto-fills for Arabic/Greek only (respects pdf_phonetics override)
  - `stampHeaderFooter(pdfBytes, chant)` — Main function applying all stamps

- **src/utils/pdfBooklet.ts** — Booklet compilation & bundling

- **src/utils/filterOptions.ts** — Filter state, fallback hardcoded defaults

- **src/utils/churchBooks.ts** — Liturgical hierarchies (menaion months, psalm sections, etc.)

- **src/utils/chantVisibility.ts** — Public rule: only status='approved' visible

### Database
- **supabase/migrations/** — Applied migrations for tables & triggers
  - `20260529_create_saved_chants.sql`
  - `20260730_chant_pdfs.sql` (multiple PDFs per chant)
  - `20260731_filter_options.sql` (dropdown values)
  - `20260914_pdf_header_footer.sql` (pdf_header, pdf_credit, pdf_phonetics columns)

---

## Development Setup

### Prerequisites
- Node.js 18+
- Supabase project with auth enabled
- GitHub Pages repo (if deploying there)

### Local Dev
```bash
npm install
npm run dev  # Starts Vite at http://localhost:5173
```

### Environment
- `.env` (git-ignored, local secrets)
- `.env.production` (committed, Supabase vars for CI)

### Build & Deploy
```bash
npm run build        # Vite bundle to dist/
npm run deploy       # Build + push to gh-pages (or use Vercel CLI)
```

---

## Current Issues & TODOs

### Known Issues
1. **Edit modal scrolling** — FIXED (61e5eb2): changed `overflow-y: visible` → `overflow-y: auto`

### Minor TODOs (Nice-to-Have)
- Mobile viewport testing for PDF viewer
- Optimize large PDF uploads (chunking/multipart)
- Add progress bar to PDF stamping for large booklets
- Expand phonetics auto-fill to more languages (currently Arabic/Greek only)

### Not Blocking
- Profile page (marked "coming soon")
- Account settings (marked "coming soon")
- Advanced search filters (working, but could expand)

---

## State Management & Data Flow

### React State
- **App.tsx** (top-level):
  - `bookletChants` — Full Chant objects selected for booklet
  - `bookletMinimized` — Is the bubble collapsed to navbar icon?
  - `bookletModalOpen` — Builder modal visible?
  - `currentPage` / `selectedChantId` — URL routing

- **ChantDetailPage.tsx**:
  - `pdfData` — Stamped PDF bytes (memoized to avoid re-render loops)

- **UploadChantModal.tsx**:
  - Form fields: title, feast, service, part, tone, language, composer, book, psalm_number, menaionMonth, menaionDay, weekTheme
  - PDF overrides: pdfHeader, pdfCredit, pdfPhonetics
  - File state: pdfFiles, existingPdfs, removedPdfIds, existingLabels, newLabels

### Supabase Queries
- **Load chants** (ChantFilter): SELECT * WHERE status = 'approved'
- **Edit chant** (UploadChantModal): UPDATE chants + INSERT chant_pdfs for new files
- **Save chant** (HomePage/LibraryPage): INSERT saved_chants
- **Load booklet submission queue** (AdminPage): SELECT * WHERE status IN ('pending', 'hidden', 'approved')

---

## CSS & Styling Notes

### Color Palette
- **Burgundy:** `#8B2635` (primary), `#6B1D29` (dark)
- **Gold:** `#C9A227` (main), `#E8D48A` (light)
- **Text:** `#2D2A26` (primary), `#5C574F` (secondary), `#8A847A` (muted)

### Key Selectors
- `.booklet-bubble` — Floating bubble container (top-right)
- `.booklet-nav-btn` — Navbar button when minimized
- `.auth-modal-body` — Edit modal scrollable area (overflow-y: auto)
- `.chant-card` — Individual chant card with animations
- `.upload-chant-form` — Edit form with grid layout

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px–1024px
- Desktop: > 1024px

Media queries adjust:
- Modal width, padding
- Form grid (2-col → 1-col on tablet)
- Font sizes, spacing

---

## Deployment

### Vercel (Current)
- Auto-deploys on push to main
- Environment variables read from `.env.production`
- Logs: `vercel logs` CLI or dashboard

### GitHub Pages (Legacy)
- `npm run deploy` pushes to gh-pages branch
- CNAME points to custom domain if needed

### Database Migrations
- Applied via Supabase SQL editor or CLI
- All current migrations in `supabase/migrations/` are applied to production

---

## Debugging & Common Issues

### "Could not find table X in schema cache"
→ Run migration in Supabase SQL editor, then refresh API cache (Database → API → Refresh)

### PDF not stamping / blank bytes
→ Check `pdfStamp.ts` for font availability (uses built-in PDF fonts, not custom)
→ Verify pdf_header/pdf_credit/pdf_phonetics are null when not set (not empty strings)

### Booklet selection not persisting
→ Check App.tsx state is being passed correctly to pages
→ Verify ChantCard receives `onToggleBooklet` callback

### Modal content not scrolling
→ Check `.auth-modal-body` has `overflow-y: auto` (fixed in 61e5eb2)
→ Verify modal has max-height constraint (`.auth-modal--signup`)

### Vite parse errors mid-edit
→ Likely incomplete JSX being saved; these clear once the file is complete
→ Run `npm run build` to verify TypeScript compiles cleanly

---

## Next Steps for Future Sessions

1. **Test on mobile** — Especially PDF viewer and booklet builder
2. **Expand chant database** — More languages, services, feasts
3. **User-facing features** — Profile page, settings, saved collections
4. **Performance** — Lazy load chants, optimize PDF caching
5. **Accessibility audit** — Color contrast, keyboard nav, screen reader support

---

## Memory & Context

Session-specific state is documented in `~/.claude/projects/.../memory/MEMORY.md`:
- Homepage design timeline
- Booklets feature implementation
- Chant submissions & visibility rules
- PDF header/footer system
- Filter options & database structure
- Deployment config

Refer to that for continuity across sessions.

---

## Quick Reference Commands

```bash
# Dev
npm run dev

# Build
npm run build

# Deploy to Vercel (if set up)
vercel deploy --prod

# Deploy to GitHub Pages
npm run deploy

# Supabase CLI (if installed)
supabase status
supabase db push  # Apply local migrations
supabase gen types typescript

# Git
git log --oneline -20     # Recent commits
git diff HEAD~5           # Last 5 commits of changes
git status                # Working tree status
```

---

**Last Updated:** 2026-09-16  
**Session:** Scrolling fix & resume update
