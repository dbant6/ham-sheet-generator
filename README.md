# HAM Sheet Generator

An offline, privacy-first single-page app for generating **HAM (History, Allergies, Medications)** emergency medical sheets. Built for senior citizens and their caretakers.

The output is a printable 8.5×11" PDF with a clearly-highlighted critical-alerts block and a vCard QR code at the bottom that paramedics can scan with any phone — no app or cell service required.

## Privacy

- **Zero backend.** The entire app runs in the browser.
- **Zero network calls.** No analytics, no fonts from CDNs, no QR-code APIs.
- **Zero persistence by default.** Closing the tab clears everything. A clearly-labeled toggle lets the user opt in to local-only `localStorage` persistence.

## Tech

- React 18 + Vite 5
- Tailwind CSS 3
- `qrcode.react` (SVG QR codes, fully offline)
- `html2pdf.js` for PDF download
- `react-to-print` for direct printing
- System fonts only (no external font requests)

## Develop

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build

```bash
npm run build      # outputs to ./dist
npm run preview    # previews the production build locally
```

For deploying under a **project page** (e.g. `username.github.io/ham-sheet-generator/`):

```bash
VITE_BASE=/ham-sheet-generator/ npm run build
```

For a **user/organization page** (e.g. `username.github.io/`), leave `VITE_BASE` unset.

## Deploy to GitHub Pages

### Option A — automated (recommended)

1. Push this folder to a new GitHub repo.
2. Settings → Pages → **Build and deployment** → Source: **GitHub Actions**.
3. Push to `main`. The included `.github/workflows/deploy.yml` builds and deploys automatically. It auto-detects the base path from the repo name.

### Option B — manual via `gh-pages` branch

```bash
npm install -g gh-pages    # one-time
VITE_BASE=/ham-sheet-generator/ npm run build
npx gh-pages -d dist
```

Then Settings → Pages → Source: **Deploy from a branch** → `gh-pages` / `(root)`.

## Project structure

```
src/
├── main.jsx                     Entry — mounts <App> inside <FormProvider>
├── App.jsx                      Wizard orchestration + site chrome
├── index.css                    Tailwind layers + ham-sheet print styles
├── state/
│   └── FormContext.jsx          useReducer-based form store w/ opt-in localStorage
├── utils/
│   ├── validation.js            Per-step validation
│   ├── vcard.js                 vCard 3.0 builder w/ proper escaping
│   └── pdf.js                   html2pdf wrapper
└── components/
    ├── Field.jsx                Text/Textarea/Select/Radio/Checkbox primitives
    ├── Stepper.jsx              Numbered step navigation
    ├── PrivacyBanner.jsx        First thing the user sees
    ├── HamSheet.jsx             The printable 8.5×11 document
    └── steps/                   The five wizard steps
```

## Accessibility & senior-friendly UX

- 18px base font, generous line-height
- Strong, visible focus rings (4px box-shadow ring)
- Large radio cards and checkboxes (≥ 20px hit target on inputs themselves; full row is clickable)
- High contrast palette (navy 700 on warm off-white)
- Clear help text under every field with concrete examples
- `prefers-reduced-motion` respected
- All inputs have proper `<label>` association via `htmlFor`/`useId`
- Validation errors are `role="alert"`, announced to screen readers

## License

MIT.
