# HAM Sheet Generator

> **A privacy-first emergency medical sheet builder for seniors and their caretakers.**

Generate a print-ready 8.5×11" PDF that paramedics can read at a glance. Takes under five minutes to fill out. Works completely offline — your medical data never leaves your device.

**Live app:** [dbant6.github.io/ham-sheet-generator](https://dbant6.github.io/ham-sheet-generator)

---

## What is a HAM Sheet?

A **HAM sheet** (History · Allergies · Medications) is a one-page emergency medical summary for first responders. When paramedics arrive, they need key information fast — medications, allergies, DNR status, emergency contacts, and your primary care doctor — in a format readable in seconds, under pressure.

This app produces one that is:
- **Color-coded by section** so responders find what they need instantly
- **Large-type and high-contrast** for readability in poor light
- **Standard letter size (8.5×11")** — put it on the fridge or inside a wallet card

---

## Features

### Guided 5-Step Wizard

The form is split into five short, focused screens — one topic at a time:

1. **Patient Info** — Name, date of birth, address, phone, email
2. **Critical Alerts** — DNR status, blood type, preferred hospital, known allergies
3. **Medical History & Medications** — PCP name/phone, past conditions, current medications and dosages
4. **Emergency Contacts & Notes** — Contacts with relationships and numbers, additional notes
5. **Review & Generate** — Full preview of your completed sheet before downloading

At any step you can go back and edit. The Review screen shows each section in a summary card with a per-section **Edit** button so you can jump straight to what you need to change.

---

### PDF Output

Clicking **Download PDF** produces a color-coded 8.5×11" letter-sized PDF built for first-responder legibility:

| Section | Accent Color |
|---|---|
| Patient Info | Navy |
| Critical Alerts | Red |
| Medications | Violet |
| Medical History | Teal |
| Emergency Contacts | Amber |

The sheet prints cleanly in black and white too — all body text stays near-black so it remains readable without a color printer.

**Important:** Use the **Download PDF** button rather than the browser's Print dialog. The downloaded PDF invisibly embeds your form data in the file, which enables a perfect lossless re-import later (see Upload below). A browser-printed PDF does not include this data.

---

### Scannable QR Code

Every PDF includes a QR code at the bottom. It encodes your medical information as a **vCard** — a standard contact format that any smartphone camera or QR reader can decode without an app or cell service.

The QR code contains:
- Full name, date of birth, address, phone
- DNR status, blood type, preferred hospital, known allergies
- Medications, medical history, emergency contacts, additional notes
- Primary care physician name and phone

The QR code is generated entirely in your browser. No external API is called. It works offline.

---

### Upload & Re-import an Existing HAM Sheet

If you already have a HAM sheet PDF — from a previous session, a different generator, or a care facility — you can upload it on the landing page to pre-fill the form instead of typing everything from scratch.

**How to upload:** Drag and drop a PDF or image onto the upload card, or click to browse. The app extracts as many fields as it can, pre-fills the form, and drops you directly into the Review step so you can check everything before saving a new copy.

#### What files work?

| File | Result | How |
|---|---|---|
| **PDF downloaded from this app** | ✅ Perfect — all 15 fields | Reads embedded metadata (invisible to humans, lossless) |
| **PDF from another HAM generator** | ✅ Good — most fields | Extracts text, parses by section headers and row labels |
| **PDF saved via browser Print dialog** | ✅ Good — most fields | Same text extraction path |
| **Photo of a HAM sheet (JPG/PNG)** | ⚠️ Limited — QR only | Scans the QR code if one is visible and well-lit |
| **Scanned image PDF** | ❌ | No selectable text; use the original digital PDF instead |

#### How the three-path import pipeline works

The app tries these in order — first success wins:

**1. Embedded metadata (our own PDFs)**
PDFs downloaded from this app store your form data as encoded JSON in the PDF's Keywords metadata field. This is invisible in any reader, but pdfjs-dist recovers it in milliseconds — giving an exact 15/15 field round-trip with no parsing required.

**2. Text extraction and parsing (any HAM-style PDF with selectable text)**
For other PDFs, the app extracts the page text and runs a section-anchored parser. It finds section headers (`CRITICAL ALERTS`, `MEDICAL HISTORY`, `CURRENT MEDICATIONS`, etc.) and then scans for labeled rows (`DNR Status`, `Blood Type`, `Known Allergies`, `PCP`, etc.) within each section. The parser is case-insensitive and tolerates variations in formatting and label wording.

**3. QR code scan (image files)**
For JPG/PNG uploads, the app scans the image for a QR code and decodes the vCard data if one is found. This is useful for photographing an older printed HAM sheet. For best results: good lighting, QR code fully in frame, minimal glare.

> The app does not use OCR on images — reading printed or handwritten text from a photo would require a ~10 MB model download and produces unreliable results. If you photograph a sheet, make sure the QR code is visible.

---

## Privacy

**Zero backend.** The app runs entirely in your browser. Nothing is ever sent to a server.

**Zero network calls.** No analytics, no fonts loaded from CDNs, no external QR APIs. The app works with no internet after the initial page load.

**Zero persistence by default.** Closing the tab clears everything. A labeled toggle at the top of the page lets you opt in to local-only `localStorage` if you want your progress saved between sessions. Your data stays on your device.

---

## Tech stack

| | |
|---|---|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 (system fonts only — no external requests) |
| PDF generation | `html2pdf.js` (rasterizes to JPEG; metadata embeds form data) |
| QR codes | `qrcode.react` (SVG, fully offline) |
| PDF import | `pdfjs-dist 4` (text + metadata extraction) |
| QR scanning | `jsqr` (in-browser image decode) |
| Printing | `react-to-print` |

---

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # outputs to ./dist
npm run preview  # preview the production build locally
```

For a **project page** (e.g. `username.github.io/ham-sheet-generator/`):

```bash
VITE_BASE=/ham-sheet-generator/ npm run build
```

## Deploy to GitHub Pages

### Automated (recommended)

1. Push to a GitHub repo
2. **Settings → Pages → Source → GitHub Actions**
3. Push to `main` — the included `.github/workflows/deploy.yml` builds and deploys automatically (detects the base path from the repo name)

### Manual

```bash
npm install -g gh-pages
VITE_BASE=/ham-sheet-generator/ npm run build
npx gh-pages -d dist
```

Then Settings → Pages → Source: **Deploy from a branch → gh-pages / (root)**.

---

## Accessibility & senior-friendly UX

- 18px base font, generous line-height
- 44px+ touch targets on all interactive elements
- Strong visible focus rings (4px box-shadow outline)
- High-contrast navy-on-warm-off-white color palette
- Every field has a `<label>` and help text with a concrete example
- Validation errors use `role="alert"` — announced to screen readers
- `prefers-reduced-motion` respected throughout

---

## License

MIT.
