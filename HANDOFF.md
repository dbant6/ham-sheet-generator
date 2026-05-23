# HAM Sheet Generator — Project Handoff

This document brings a new collaborator (human or model) up to speed on the **why**, not just the **what**. The code is self-explanatory; the decisions behind it aren't.

If you're a model picking this up cold: read this file first, then `README.md`, then poke around `src/`.

---

## What this is

A privacy-first, single-page React app that lets seniors (and their caretakers) generate a printable **HAM (History, Allergies, Medications)** emergency medical sheet. The output is an 8.5×11" PDF that paramedics can read at a glance, with a scannable vCard QR code at the bottom for offline access.

**Critical constraint:** zero backend, zero network calls, zero analytics. The app runs entirely in the browser. The user's medical data never leaves their device.

Hosted on GitHub Pages. Built with Vite + React + Tailwind.

---

## What's been built (working)

1. **Five-step wizard** — Patient → Critical Alerts → History/Meds → Contacts/Notes → Review.
2. **All 15 required form fields** with help-text/examples per the original spec.
3. **PDF generation** via html2pdf.js. The sheet is color-coded by section (navy patient, red critical alerts, violet meds, teal history, amber contacts) using a watercolor-wash aesthetic — soft tinted backgrounds + 5px accent rails, body text stays near-black for paramedic readability and B&W printer survival.
4. **vCard QR code** at the bottom of the PDF, generated via `qrcode.react` (SVG, fully offline).
5. **Intake upload** — user can drop a PDF of an existing HAM sheet and we pre-fill the form. Three extraction paths, in priority order (see below).
6. **Mobile-responsive** — preview dynamically scales to container width via ResizeObserver; review rows stack on small screens; touch targets ≥ 44px.
7. **Optional local persistence** — opt-in toggle, off by default. Closing the tab forgets everything unless the user explicitly enabled the save.
8. **GitHub Actions deploy workflow** at `.github/workflows/deploy.yml`. Auto-detects base path from the repo name.

---

## The three-path import pipeline (the trickiest piece)

When a user uploads a file to pre-fill the form, `src/utils/extract.js` tries these **in order**, first hit wins:

### 1. PDF metadata (perfect round-trip for our own sheets)

**Why:** html2pdf.js **rasterizes** the page (it embeds a JPEG in the PDF). So our own PDFs have **no selectable/extractable text**. Without a workaround, the text parser would never work on a sheet this app produced. The QR code was the fallback, but the user explicitly asked us not to depend on QR.

**Solution:** when generating a PDF, we encode the structured form data as base64 JSON and write it into the PDF's `Keywords` metadata field. On re-upload, `pdf.getMetadata()` returns it directly. Instant 15/15 field round-trip.

**Files:**
- `src/utils/pdf.js` — `HAM_META_PREFIX`, `encodePayload`, `decodePayload`, `downloadPdf` (chains through html2pdf to access the jsPDF instance and call `setProperties` before save).
- `src/utils/extract.js` — `extractFromPdfFile` reads metadata first.

### 2. Text parsing (works on any HAM-style sheet with recognizable section headers)

**Why:** the user uploaded an example from a different generator (LW Seal Beach). That PDF has selectable text. So for third-party HAM sheets, text extraction + regex parsing works fine.

**How:** `src/utils/parseHamPdf.js` is a **section-anchored parser**. It splits the PDF text by canonical section headers (`CRITICAL ALERTS`, `HISTORY`, `ALLERGIES`, `MEDICATIONS`, `EMERGENCY CONTACTS`) and then within each section captures content between known row labels (`DNR Status`, `Blood Type`, `Primary Care Physician`, `Past/Current Conditions`, `Medications & Dosages`, `Contacts`, `Additional Info`, etc.). Case-insensitive, tolerates optional colons/dashes, normalizes blood types and Y/N values.

**Tested against the actual LW Seal Beach example PDF: 12/12 fields recovered.** Blood Thinners (a field that exists in their format but not ours) is preserved by prepending it to Additional Info — `"Blood Thinners: Yes\n..."` — so the info isn't dropped.

### 3. QR scan (legacy fallback for images only)

**Why:** we kept QR scanning for images because a senior who photographs an older sheet of theirs might benefit from it. But it's no longer the primary path.

**Image uploads with no QR** get a friendly error suggesting they upload the PDF instead. We deliberately **do not OCR images** — Tesseract.js would mean a ~10MB model download and unreliable handwriting accuracy.

---

## Design philosophy applied

The app was built against the design philosophy skill's four-question rubric:

- **Clarity is kindness** (most load-bearing). Paramedics scanning under stress + seniors entering data with arthritic hands. 18px base type, generous focus rings, large radio cards, single primary action per screen.
- **Emotional resonance over sterile.** Warm off-white (`#fafaf7`) instead of harsh white. Calming navy primary. Coral reserved for actual emergencies. Linen-gradient drop zone on the upload card so it feels like paper, not a panel.
- **Small meaningful touches.** Personalized "Welcome back, Jane" greeting after a successful upload. Watercolor section accents on the PDF. Custom SVG icons instead of unicode glyphs.
- **Story moments.** The privacy banner addresses the user's likely fear directly in second person. The upload success state acknowledges what the user did, not what the system did.

Touchstones: **Apple** (warm precision) + **Claude Code** (deep technical mastery hidden behind a friendly surface — the upload feature parses three different extraction paths but the UI says "drop a file").

---

## Architectural decisions worth remembering

### Why html2pdf.js and not @react-pdf/renderer

`@react-pdf/renderer` would have given us vector text (selectable, extractable, smaller files) but requires rewriting `HamSheet.jsx` into its own component primitives, and emoji/font handling is finicky. html2pdf preserves the Tailwind-styled visual fidelity. The metadata round-trip closes the gap that vector text would have provided.

If you ever want to switch to vector PDFs, the path is: rewrite `HamSheet.jsx` using `@react-pdf/renderer`'s `<Document>/<Page>/<View>/<Text>`, register a font with emoji support, and drop the metadata embedding (you'd get text extraction for free).

### Why useReducer + Context instead of Zustand or Redux

Form state is small and lives in one place. The reducer has six actions (`set_field`, `merge_data`, `set_step`, `set_errors`, `set_persist`, `hydrate`, `reset`). Adding a library would be overkill.

### Why opt-in localStorage instead of always-on

The default expectation for a medical app should be "nothing is saved." We give the user the choice instead of making it for them. The toggle is in the green privacy banner at the top — it's the second thing they see after the page loads.

### Why a wizard instead of one long form

For seniors, fewer fields per screen lowers cognitive load. Each step is short and focused. The Review step shows everything in summary cards with per-section Edit buttons, so jumping back is one click.

### Why we added PCP + Phone(s) to the vCard NOTE (deviation from spec)

The original spec's vCard template didn't include PCP. Paramedics want to call the PCP fast, and re-uploaded sheets shouldn't lose that info. We added two lines (`PCP:` and `Phone(s):`) to the CRITICAL block of the NOTE field. The vCard QR still parses with standard tools.

---

## Files map

```
src/
├── main.jsx                          Entry — mounts <App> inside <FormProvider>
├── App.jsx                           Wizard orchestration + site chrome
├── index.css                         Tailwind layers + ham-sheet print styles
├── state/
│   └── FormContext.jsx               useReducer store, opt-in localStorage
├── utils/
│   ├── validation.js                 Per-step required-fields validation
│   ├── vcard.js                      vCard 3.0 builder with escaping
│   ├── parseVCard.js                 Inverse: vCard string → form data
│   ├── parseHamPdf.js                Section-anchored PDF text parser
│   ├── extract.js                    Orchestrates the 3-path import pipeline
│   └── pdf.js                        downloadPdf + metadata embed/decode
└── components/
    ├── Field.jsx                     Text/Textarea/Select/Radio/Checkbox primitives
    ├── Stepper.jsx                   Numbered step navigation
    ├── PrivacyBanner.jsx             The first thing the user sees
    ├── IntakeUpload.jsx              Quick-start file upload card
    ├── HamSheet.jsx                  The printable 8.5×11 document
    └── steps/                        Five wizard steps + Review
```

---

## Known caveats and edge cases

- **html2pdf.js rasterizes** — our PDFs are not text-selectable in a reader. The metadata path makes this OK for round-tripping; the visual experience is unchanged. Don't be surprised if "Find" in Preview/Acrobat doesn't work on our generated PDFs.
- **Phone is normalized in the vCard** — we extract just the first phone number into the TEL field. The full free-form phone string is preserved in the NOTE's `Phone(s):` line.
- **Trailing line dashes can be lost in PDF text extraction** — if a row label like "High Cholesterol -" ends a line and the next line starts with "Heart Attack", pdftotext-style extractors sometimes drop the trailing dash. The data is mostly preserved; the user can edit on review.
- **The text parser depends on canonical section vocabulary.** If you encounter a HAM sheet that uses non-standard labels ("Doctor:" instead of "Primary Care Physician"), some fields will be missed. Adding new label aliases is a one-line change in `parseHamPdf.js` (`LABELS` / `ROW_LABEL_BOUNDARIES`).
- **The `?url` pdfjs worker import** assumes Vite 4+. If you switch bundlers, you'll need to update `loadPdfJs()` in `extract.js`.
- **Blood Thinners** isn't a form field — when it's parsed from a third-party PDF it gets prepended to `additionalInfo`. If you want it as a proper field, add it to `initialData` in `FormContext.jsx`, the `StepAlerts.jsx` form, the `HamSheet.jsx` critical block, and `buildVCard.js`'s NOTE.

---

## How to resume in a new chat

1. Open a new Cowork session.
2. Mount the same folder: `~/Documents/Claude Code/ham-sheet-generator/`.
3. Open this file first (`HANDOFF.md`), then `README.md`.
4. If you have a specific change in mind, just describe it — the file structure and decisions above should give Claude enough context to pick up cleanly.

---

## Build & deploy quick reference

```bash
npm install
npm run dev                 # http://localhost:5173
npm run build               # → ./dist

# For a project page (user.github.io/<repo-name>/):
VITE_BASE=/<repo-name>/ npm run build

# Auto-deploy: push to main; .github/workflows/deploy.yml handles the rest.
```

Dependencies of note: `react@18`, `vite@5`, `tailwindcss@3`, `qrcode.react`, `html2pdf.js`, `react-to-print`, `jsqr`, `pdfjs-dist@4`.
