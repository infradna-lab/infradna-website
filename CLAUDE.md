# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server with HMR
npm run build        # tsc -b (type-check) then vite build → dist/
npm run lint         # ESLint over the repo
npm run preview      # Serve the production build locally
npm run build:tokens # style-dictionary build (see Design Tokens caveat)
```

No test runner is configured.

## Architecture

Marketing site for 인프라재난관리진흥원 (Infrastructure Disaster Navigation Agency): React 19 + TypeScript + Vite 7 + Tailwind CSS v4. No state library, no data fetching — static, presentational, Korean-language content.

**Routing** — `main.tsx` wraps `<App />` in `<BrowserRouter>` (react-router-dom v7). `App.tsx` defines the routes:
- `/` → `HomePage`
- `/projects/:id` → `ProjectDetailPage` (per-project detail; `:id` matches `Project.id`)

`ScrollManager` (rendered once in `App`) resets scroll on navigation: to the element named by the URL hash if present (e.g. `/#projects`), otherwise to the top. Direct hits / refreshes on `/projects/:id` rely on SPA history fallback — fine under `vite dev`/`preview`, but static hosting needs a catch-all rewrite to `index.html`.

**HomePage composition** — `HomePage` (`src/pages/HomePage.tsx`) renders five section components in order:
`HeaderSection → AboutSection → FocusSection → ProjectSection → FooterSection` (all in `src/components/`). `ProjectSection` carries `id="projects"` (the back-link anchor); its cards `<Link>` to `/projects/:id`.

**Project data** — the five research projects live in `src/data/projects.ts` (`projects` array + `getProject(id)`), consumed by both `ProjectSection` (cards) and `ProjectDetailPage`. Detail copy there is placeholder scaffolding to be replaced with real project material.

Each section is a self-contained full-width block owning its own copy and layout, animated on mount with Framer Motion. Korean text uses the `break-keep` utility to avoid mid-word line breaks. Icons come from `lucide-react`.

**Animation** — components import `{ motion }` from `'framer-motion'` (bundled via the `motion` dependency in package.json). Match that import path when adding animation; do not import from `motion/react`.

## Styling — read before touching styles

Tailwind v4 is wired through the `@tailwindcss/vite` plugin. The only stylesheet is `src/index.css`, whose entire content is `@import "tailwindcss";`.

**`tailwind.config.js` is NOT loaded.** In Tailwind v4 a legacy JS config only applies if the CSS pulls it in with `@config`, and `index.css` does not. So that file's theme extension, custom token scales, and `darkMode: "class"` are all currently inert. Components instead style with:
- Stock Tailwind utilities — `slate-*` is the working neutral palette (plus `blue-50`, etc.)
- Arbitrary values for brand colors — recurring `text-[#1e3a5f]` (navy) and `bg-[#0891b2]` (cyan)
- Responsive `md:` prefixes and `container mx-auto` for layout

To make a custom theme or the design tokens actually take effect, add `@config "../tailwind.config.js";` to `index.css`, or migrate the theme into a CSS `@theme` block. Until then, editing `tailwind.config.js` changes nothing at runtime.

## Design Token Pipeline (currently disconnected from the app)

A Tokens Studio → Style Dictionary pipeline exists in the repo, but its output is not consumed by anything: `tokens.json` is never imported, and (per above) the Tailwind JS config it feeds is not loaded.

1. `tokens/default-token.json` — source, Tokens Studio format
2. `sd-tokens-config.js` — run with `node sd-tokens-config.js`; registers `@tokens-studio/sd-transforms` and emits `tokens.json`
3. `tw-tokens-config.js` — run with `node tw-tokens-config.js`; converts `tokens.json` into a Tailwind-shaped config via `sd-tailwindcss-transformer`
4. `tailwind.config.js` — hand-maintained theme (see Styling caveat)

Caveat: the `build:tokens` npm script is `style-dictionary build`, which needs a default Style Dictionary config file that this repo doesn't have. The two scripts above are the real entry points and are run directly with `node`.

## Linting

Two ESLint configs coexist: the flat `eslint.config.js` (typescript-eslint + react-hooks + react-refresh) and a legacy `.eslintrc.json` (airbnb + prettier). If lint output looks unexpected, check which config is actually being resolved.
