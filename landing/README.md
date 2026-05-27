# vuln-analyzer landing page

Static landing page for [vuln-analyzer](https://github.com/romansok/vuln-analyzer),
published at https://romansok.github.io/vuln-analyzer/.

Built with Next.js 16 (App Router, static export), Tailwind CSS v4, and
Framer Motion. Compiles to plain HTML in `out/` — no server required.

## Local development

```bash
cd landing
npm install
npm run dev        # http://localhost:3000
```

`basePath` is dropped during `next dev` so all routes resolve at the root.

## Production build (matches the deployed shape)

```bash
npm run build      # writes static export to landing/out/
npx serve out      # serve the actual export
```

When you serve the production build locally, the prefix is applied — open
`http://localhost:3000/vuln-analyzer/` instead of the root.

To preview the build *without* the prefix:

```bash
PAGES_BASE_PATH= npm run build
```

## Project layout

```
landing/
├── app/
│   ├── layout.tsx               root layout, fonts, metadata
│   ├── page.tsx                 composes the section components
│   ├── globals.css              tailwind import + design tokens
│   └── components/              all sections + reusable bits
├── lib/
│   ├── terminal-script.ts       terminal animation types + tuning
│   └── util.ts                  cn() + repo URL constants
├── public/
│   ├── favicon.svg
│   └── .nojekyll                forces GitHub Pages to serve _next/
├── next.config.mjs              basePath, assetPrefix, output: 'export'
└── package.json
```

## Deployment

Pushed automatically on every `main` commit that touches `landing/` (see
[`.github/workflows/deploy-landing.yml`](../.github/workflows/deploy-landing.yml)).
The workflow builds the export, copies `.nojekyll` into it, and ships the
result via the official `actions/deploy-pages` action.

One-time repo setup: **Settings → Pages → Source: GitHub Actions.**
