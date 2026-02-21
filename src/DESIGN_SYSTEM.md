# Psaltikon Library — Design System

## ☦ Project Identity

**Name:** Psaltikon Library  
**Tagline:** "A Sacred Treasury of Byzantine Chant"

---

## 🎨 Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Parchment | `#F5EBD7` | Main background |
| Parchment Light | `#FDF8EF` | Card backgrounds, lighter areas |
| Parchment Dark | `#E8DCC8` | Borders, subtle backgrounds |

### Accent Colors
| Name | Hex | Usage |
|------|-----|-------|
| Deep Burgundy | `#722F37` | Primary accent, headers, important text |
| Burgundy Dark | `#5A252C` | Button hover states, shadows |
| Burgundy Light | `#8B3D46` | Hover states |
| Imperial Purple | `#4A1942` | Secondary accent, special sections |
| Purple Light | `#6B2A5F` | Hover states |

### Gold Accents
| Name | Hex | Usage |
|------|-----|-------|
| Gold | `#C4A35A` | Highlights, icons, ornaments |
| Gold Bright | `#D4B86A` | Hover states, glows |
| Gold Muted | `#8B7355` | Borders, subtle accents |

### Neutral Colors
| Name | Hex | Usage |
|------|-----|-------|
| Midnight Blue | `#1B2838` | Dark backgrounds, text |
| Midnight Light | `#2A3A4D` | Lighter dark areas |
| Incense Gray | `#6B5B4F` | Secondary text |

### Functional Colors
| Name | Hex | Usage |
|------|-----|-------|
| Candlelight | `#FFCC66` | Glows, highlights |

---

## 📖 Typography

### Font Families

1. **Cinzel** — Display/Headers
   - Regal, Byzantine feel
   - Use for: Page titles, section headers, buttons, navigation
   - Weight: 400-700
   - Style: Uppercase with letter-spacing

2. **Cormorant Garamond** — Body Text
   - Elegant, highly readable
   - Use for: Body copy, descriptions, quotes
   - Weight: 400-600
   - Style: Normal, Italic for quotes

3. **EB Garamond** — Secondary/UI
   - Classic, liturgical feel
   - Use for: Badges, labels, metadata, citations
   - Weight: 400-500

### Typography Scale

| Element | Font | Size | Weight | Style |
|---------|------|------|--------|-------|
| H1 (Page) | Cinzel | 2.5-3.5rem | 400 | Uppercase, tracking-wider |
| H2 (Section) | Cinzel | 1.5-2rem | 400 | Uppercase, tracking-wider |
| H3 (Card) | Cinzel | 1.125rem | 400 | Normal |
| Body | Cormorant Garamond | 1.125rem | 400 | Normal |
| Small | Cormorant Garamond | 0.875rem | 400 | Normal |
| Label | EB Garamond | 0.75rem | 500 | Uppercase, tracking-widest |
| Button | Cinzel | 0.85rem | 400 | Uppercase, tracking-wide |

---

## 🏛️ Components

### Buttons

**Primary Button (Burgundy)**
```css
background: linear-gradient(145deg, #722F37 0%, #5A252C 100%);
color: #FDF8EF;
border: 1px solid #5A252C;
padding: 0.75rem 1.5rem;
font-family: Cinzel;
text-transform: uppercase;
letter-spacing: 0.05em;
```

**Gold Button**
```css
background: linear-gradient(145deg, #C4A35A 0%, #8B7355 100%);
color: #1B2838;
border: 1px solid #8B7355;
```

**Outline Button**
```css
background: transparent;
color: #722F37;
border: 1px solid #722F37;
```

### Cards (Manuscript Style)
```css
background: linear-gradient(145deg, #FDF8EF 0%, #F5EBD7 100%);
border: 1px solid #8B7355;
border-radius: 4px;
box-shadow: 
  0 2px 4px rgba(27, 40, 56, 0.08),
  0 8px 16px rgba(27, 40, 56, 0.04),
  inset 0 1px 0 rgba(255, 255, 255, 0.5);
```

### Badges

| Type | Background | Text Color |
|------|------------|------------|
| Tone | `#4A1942` (Purple) | `#FDF8EF` |
| Feast | `#722F37` (Burgundy) | `#FDF8EF` |
| Service | `#1B2838` (Midnight) | `#FDF8EF` |
| Part | `#8B7355` (Gold Muted) | `#FDF8EF` |
| Language | Transparent + border | `#6B5B4F` |

### Dividers

Three variants available:
1. **Default:** Simple gold dots
2. **Cross:** With Orthodox cross (☦) in center
3. **Ornate:** With decorative fleurons (❧☦☙)

---

## 📐 Layout Principles

### Spacing
- Use generous whitespace for sacred, calm feeling
- Sections: `py-16` to `py-24`
- Cards: `p-5` to `p-8`
- Gap between cards: `gap-6`

### Grid
- Max width: `max-w-7xl` (1280px)
- Card grids: 1-4 columns responsive
- Sidebar: 288px fixed width on desktop

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 🔮 Future Integration Notes

### Catalog System Structure
The UI is designed to accommodate:
1. **Feast-based organization** — Primary taxonomy
2. **Service types** — Vespers, Matins, Liturgy, etc.
3. **Parts of service** — Apolytikion, Kontakion, Stichera, etc.
4. **Tone/Echos** — Eight modes of Byzantine chant
5. **Language** — Greek, Arabic, English, Slavonic, etc.

### PDF Generation Feature (Coming Soon)
The "Add to Booklet" buttons throughout the UI will eventually:
1. Add chants to a user's selection list
2. Allow reordering and customization
3. Generate a formatted PDF booklet
4. Support various paper sizes and layouts

### Backend Integration Points
- `/api/chants` — Chant listing with filters
- `/api/chants/:id` — Single chant details
- `/api/compositions` — General compositions
- `/api/phonetics` — Arabic chants with transliteration
- `/api/booklet/generate` — PDF generation endpoint

### Search Enhancement
Future search will support:
- Full-text search across titles (Greek, Arabic, English)
- Fuzzy matching for transliteration variations
- Filter combinations
- Saved searches

---

## ✝️ Orthodox Design Elements

### Cross Motifs
- Use the Orthodox three-bar cross (☦) sparingly
- Primary use: Dividers, headers, footer
- Color: Always gold (#C4A35A) or muted gold (#8B7355)

### Quotes
Include 1-3 brief Scripture or Patristic quotes:
- Placed in visually distinct blockquotes
- Use Cormorant Garamond italic
- Purple or burgundy text
- Always include source attribution

### Ornamental Separators
- Byzantine-inspired fleurons: ❧ ☙
- Stars: ✦
- Used in dividers, not standalone

### Overall Atmosphere
- **Reverent:** Not casual or playful
- **Calm:** No jarring animations or colors
- **Sacred:** Evokes a monastery library
- **Warm:** Candlelight palette, not sterile white

---

## 📋 Checklist for New Components

When creating new UI elements:
- [ ] Uses Cinzel for headers/buttons
- [ ] Uses Cormorant Garamond for body text
- [ ] Follows color palette strictly
- [ ] Has appropriate hover states
- [ ] Includes ornamental details where appropriate
- [ ] Maintains reverent, calm aesthetic
- [ ] Is responsive across breakpoints
- [ ] Uses manuscript-card styling for containers
- [ ] Badges follow established color coding

---

*To the glory of the Holy Trinity and for the edification of the faithful.*
