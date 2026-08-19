# ArchLucid UI — Dependency & Software-Supply-Chain Assessment

**Date:** 2026-07-12
**Scope:** `archlucid-ui/` (Next.js App Router application) and its workspace package `archlucid-ui/packages/api-types`.
**Method:** Read-only repository analysis — manifest/lockfile inspection, static + dynamic import tracing, config/script cross-referencing, and locally-run read-only npm commands (`npm audit`, lockfile parsing). No code, manifest, lockfile, build configuration, or application behavior was modified. No packages were installed, removed, or upgraded.

---

## 1. Sponsor summary

The UI's dependency graph is **large but not undisciplined**. `archlucid-ui/package-lock.json` (npm, lockfileVersion 3) resolves to **1,236 total package/version nodes** (1,048 distinct package names) — this is the origin of the "almost 1,200 packages" figure, and it is a **transitive dependency-graph size**, not a count of packages the team chose, imports directly, or ships to browsers.

The application itself declares only **65 direct dependencies** in `archlucid-ui/package.json`: **39 production** (38 external + 1 internal workspace package) and **26 development**. Everything else in the 1,236-node graph is pulled in transitively by those 65 packages' own dependency trees — principally the Next.js/React toolchain, the ESLint 9 flat-config ecosystem, the Vitest/Vite test-transform ecosystem, the Playwright/Lighthouse/Puppeteer E2E/perf ecosystem, and Mermaid's own diagram/graph-layout engine.

Findings of substance:

- **Two direct dependencies are unused** anywhere in source, config, scripts, or tests: `@microsoft/applicationinsights-react-js` and `ajv` (which drags in `ajv-formats`, also unused). These are safe, low-effort, low-risk removals (Tier 1).
- **Zero known vulnerabilities** were reported by `npm audit` across all 1,236 nodes at the current lockfile state (point-in-time result; re-verify before relying on it for compliance evidence).
- **No meaningful "redundant library family" problem exists.** There is exactly one component-primitive system (Radix + shadcn conventions), one icon library (`lucide-react`), one validation library in active use (`zod`; `ajv`/`ajv-formats` are dead weight, not a second validation stack), one form library (`react-hook-form` + `@hookform/resolvers`), one charting library (`recharts`, and its import surface is *already* policy-enforced by a repository test), one graph-diagramming library (`reactflow`), one flowchart-text renderer (`mermaid`), and one HTTP layer (native `fetch` via `@tanstack/react-query`, no axios/ky duplicate). This is a genuinely clean dependency shape for an app of this size.
- **Heavy client-side libraries (mermaid, html2canvas, jspdf, Application Insights Web) are already dynamically imported**, not statically bundled — this is correct, deliberate architecture, evidenced by the source itself and by an existing repository-enforced test (`recharts-import-policy.test.ts`, TB-570) that pins `recharts` to a single dynamically-loaded module.
- The dominant *disk-footprint* contributors (`next`, `@next/swc-win32-x64-msvc`, the Application Insights suite, `mermaid`, `typescript`, Vite/rolldown/esbuild native binaries, Lighthouse/Puppeteer) are almost entirely build-time, dev-time, or dynamically-loaded — **install footprint size is a poor proxy for browser-bundle size in this repository**, and the two must not be conflated.
- Real, already-captured **First Load JS** evidence (`performance/first-load-js-baseline.v1.json`, refreshed same day as this assessment) shows `/welcome` at 724.9 KB, `/governance` at 1,399.9 KB, `/reviews` at 1,633 KB, and `/reviews/[runId]` at 2,150.9 KB. These are the numbers that actually matter for user-perceived performance, and they are the ones worth optimizing — not the 1,236-node graph size.

**Bottom line:** the package-count figure is dramatically overstating the actual problem. The dependency graph is well-governed in the places that matter (bundle-affecting libraries) and has a small, well-evidenced set of genuinely unused direct dependencies. This assessment recommends **targeted cleanup**, not substantial cleanup or architectural consolidation. See §22.

---

## 2. What the "almost 1,200 packages" figure actually represents

| Metric | Value | Source |
|---|---|---|
| Total package/version nodes in lockfile | **1,236** | `package-lock.json` `packages` map (own parse) and `npm audit --json` → `metadata.dependencies.total` (both agree) |
| Distinct package **names** | **1,048** | own lockfile parse (a name counted once regardless of how many versions of it are installed) |
| Package names installed at **more than one version simultaneously** | **75** | own lockfile parse — see §7 |
| Direct dependencies declared in `archlucid-ui/package.json` | **65** (39 prod + 26 dev) | `package.json` |
| npm-audit-flagged **prod** nodes | 306 | `npm audit --json` |
| npm-audit-flagged **dev** nodes | 912 | `npm audit --json` |
| npm-audit-flagged **optional** nodes | 124 | `npm audit --json` (mostly per-platform native binaries; only the ones matching the current OS/arch actually download) |
| npm-audit-flagged **peer** nodes | 1 | `npm audit --json` |

`prod + dev + optional + peer` (306+912+124+1 = 1,343) **exceeds** the 1,236 total because these are non-exclusive tags — a single node can be simultaneously "optional" and "dev" (e.g., a platform-specific binary required only by a devDependency). The lockfile does not represent "1,200 packages the team pulled in"; it represents **the fully-resolved, deduplicated dependency closure of 65 direct dependencies**, most of which belong to build/lint/test tooling rather than to the shipped application.

**What it is not:**
- It is **not** 1,200 direct dependencies (there are 65).
- It is **not** 1,200 packages imported by ArchLucid source (source imports ~35 of the 39 production packages; see §5).
- It is **not** 1,200 packages present in any browser bundle (see §9 — the browser-bundle-reachable set is a small fraction of the 306 "prod" nodes, since most prod-tagged nodes belong to the standalone server runtime, not the client bundle).
- It is **not** evidence of "unnecessary" dependencies — the overwhelming majority are transitive requirements of large, legitimate ecosystems (ESLint 9, Vitest/Vite, Playwright, Next.js/SWC, Lighthouse/Puppeteer, Mermaid's Cytoscape-based layout engine) that cannot be individually removed without removing the direct dependency that requires them.

---

## 3. UI application root and repository structure (evidence)

| Item | Finding | Evidence |
|---|---|---|
| UI application root | `archlucid-ui/` | Next.js App Router source under `archlucid-ui/src/app/**` |
| Package manager | **npm** (do not switch — confirmed per lockfile presence and `npm ci` documented as the install command) | `archlucid-ui/package-lock.json`, `lockfileVersion: 3`; `archlucid-ui/AGENTS.md` § Typical commands: `npm ci` |
| Workspace/monorepo structure | npm workspaces, scoped to `archlucid-ui/packages/*` | `archlucid-ui/package.json` → `"workspaces": ["packages/*"]`; one member: `archlucid-ui/packages/api-types` (`@archlucid/api-types`) |
| Repo-root `package.json` | A **non-participating forwarding shim** — no `dependencies`, no `workspaces` field, just one npm-script alias (`test:e2e:accessibility`) that calls `npm --prefix archlucid-ui run ...` | `./package.json` |
| Package manifests | `archlucid-ui/package.json` (app), `archlucid-ui/packages/api-types/package.json` (workspace member) | read directly |
| Lockfiles | `archlucid-ui/package-lock.json` only (634 KB, lockfileVersion 3) — no root-level lockfile, no yarn/pnpm lockfiles present anywhere in the tree | `Glob` for `package.json`/lockfiles across repo |
| Next.js version | `^16.2.10` | `archlucid-ui/package.json` dependencies |
| React version | `^19.2.0` (`react`, `react-dom`) | `archlucid-ui/package.json` |
| Node version expectation | **Node 22** by convention (Dockerfile `FROM node:22-alpine` ×3 stages; CI workflows pin `node-version: "22"` in `ci.yml`, `rc-release-gate.yml`, `live-e2e-nightly.yml`) — **not enforced via `package.json` `engines`** (only the workspace member declares `"engines": {"node": ">=18"}`, which is looser than what's actually used) | `archlucid-ui/Dockerfile`, `.github/workflows/*.yml`, `archlucid-ui/packages/api-types/package.json` |
| Build tooling | Next.js build pipeline (`next build`, `output: "standalone"`), `@next/bundle-analyzer` (env-gated via `ANALYZE`), PostCSS + Autoprefixer + Tailwind CSS v3.4.17, a chain of custom pre/post-build scripts (brand raster generation via `sharp`, glossary sync via `tsx`, pricing generation, help-search-index build, docs-PDF build via `tsx`, API-type generation via `openapi-typescript`, Next-export cleanup) | `archlucid-ui/package.json` `scripts`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts` |
| Test tooling | **Vitest 4** (unit/component, jsdom environment, `@vitejs/plugin-react`, Testing Library trio, `jest-axe` for a11y assertions) + **Playwright** (`@playwright/test`, `@axe-core/playwright`) across **5 separate configs** (`playwright.config.ts` live-API default, `.mock.config.ts`, `.operator-mock.config.ts`, `.live.config.ts`, `.trial-funnel-test-mode.config.ts`) | `vitest.config.ts`, `archlucid-ui/*.config.ts`, `package.json` scripts |
| Linting tooling | **ESLint 9** flat config (`eslint.config.mjs`) built on `eslint-config-next` (`core-web-vitals` + `typescript` rule sets) plus a **repository-authored custom plugin** (`eslint-rules/buyer-review-terminology.mjs`) enforcing product-copy conventions | `eslint.config.mjs` |
| Component libraries | **shadcn/ui code-generation convention** (`components.json`, style `new-york`, RSC-aware) generating local, checked-in files under `src/components/ui/*` backed by **9 individual `@radix-ui/react-*` primitives** (not a single "radix-ui" umbrella package) + `cmdk` (command palette), `class-variance-authority` + `tailwind-merge` + `clsx` (the `cn()` utility pattern), and `lucide-react` for icons. There is **no second component library** (no MUI, Chakra, Ant Design, etc.) | `components.json`, `src/components/ui/*.tsx`, `package.json` |
| Deployment packaging | Multi-stage `Dockerfile` (`node:22-alpine`) producing a Next.js **standalone** output (self-contained `node_modules` subset copied via Next's file tracing); security headers (CSP, X-Frame-Options, Permissions-Policy) and long-lived immutable caching for fingerprinted static assets applied in `next.config.ts`; a documented Windows-only escape hatch (`ARCHLUCID_SKIP_STANDALONE_OUTPUT`) works around an upstream Next.js file-tracing `ENOENT` on Windows dev machines (Docker/Linux unaffected) | `archlucid-ui/Dockerfile`, `next.config.ts` |

---

## 4. Direct production dependency inventory

39 entries in `dependencies` (38 external packages + 1 internal workspace package). "Repository usage" reflects actual source-code/config tracing (§ methodology in §21), not assumption.

| Package | Version range | Repository usage | Disposition |
|---|---|---|---|
| `@archlucid/api-types` | `workspace:*` | Internal monorepo package sharing OpenAPI-generated TS types. Directly imported by 1 file (`admin-configuration-types.ts`); most call sites instead import the locally generated `src/lib/api-types.generated.ts` re-exported via `src/lib/openapi-schemas.ts`. Required at build time (`npm run build:api-types` runs before `next build`; Dockerfile comment confirms `dist/` is not committed and must be built). Type-only import → **zero runtime/bundle cost** regardless of import count. | **Keep** |
| `@azure/communication-email` | `^1.1.0` | Used server-side in `src/lib/server/access-request-email.ts` | **Keep (server-only)** |
| `@hookform/resolvers` | `^5.2.2` | Paired with `react-hook-form`/`zod`; used across signup, wizard, and integration forms | **Keep** |
| `@microsoft/applicationinsights-react-js` | `^19.4.0` | **No import found anywhere** in `src/`, scripts, configs, or tests | **Tier 1 — remove** (see §5) |
| `@microsoft/applicationinsights-web` | `^3.4.1` | Dynamically imported (`await import(...)`) in `src/lib/telemetry.ts`; route auto-tracking configured manually instead of via the (unused) React plugin | **Keep** |
| `@radix-ui/react-alert-dialog` | `^1.1.15` | `src/components/ui/alert-dialog.tsx` | **Keep** |
| `@radix-ui/react-collapsible` | `^1.1.12` | `src/components/ui/collapsible.tsx` | **Keep** |
| `@radix-ui/react-dialog` | `^1.1.15` | `src/components/ui/dialog.tsx` | **Keep** |
| `@radix-ui/react-label` | `^2.1.8` | `src/components/ui/label.tsx` | **Keep** |
| `@radix-ui/react-progress` | `^1.1.8` | `src/components/ui/progress.tsx` | **Keep** |
| `@radix-ui/react-select` | `^2.2.6` | `src/components/ui/select.tsx` | **Keep** |
| `@radix-ui/react-separator` | `^1.1.8` | `src/components/ui/separator.tsx` | **Keep** |
| `@radix-ui/react-slot` | `^1.2.4` | `src/components/ui/button.tsx` (`asChild` pattern) | **Keep** |
| `@radix-ui/react-tooltip` | `^1.2.8` | `src/components/ui/tooltip.tsx`, `HelpDrawerContent.tsx` | **Keep** |
| `@tanstack/react-query` | `^5.101.0` | Server-state layer; ~15+ hooks and `OperatorQueryProvider`/`operator-query-client.ts` | **Keep** |
| `@tanstack/react-virtual` | `^3.13.24` | 3 large operator tables (audit events, governance findings queue, finding explainability) | **Keep** |
| `ajv` | `^8.20.0` | **No import found anywhere** in source. Not required by any other direct dependency (transitively required only by the also-unused `ajv-formats`) | **Tier 1 — remove** (see §5, §7) |
| `ajv-formats` | `^3.0.1` | **No import found anywhere**; exists only to extend `ajv`, which is itself unused | **Tier 1 — remove** |
| `class-variance-authority` | `^0.7.1` | `badge.tsx`, `label.tsx`, `button.tsx` variant definitions | **Keep** |
| `clsx` | `^2.1.1` | `src/lib/utils.ts` (`cn()` helper, paired with `tailwind-merge`) | **Keep** |
| `cmdk` | `^1.1.1` | `CommandPalette.tsx`, `src/components/ui/command.tsx` | **Keep** |
| `diff` | `^8.0.3` | `src/lib/architecture/architecture-manifest-line-diff.ts` | **Keep** |
| `fflate` | `^0.8.3` | Zip read/write for Azure extractor + Tier-1 inventory package uploads (16+ files) | **Keep** |
| `html2canvas` | `^1.4.1` | Dynamically imported in 3 export features (graph PNG export, drift-chart PDF export, CTO demo leave-behind) | **Keep (correctly code-split)** |
| `jspdf` | `^4.2.1` | Dynamically imported alongside `html2canvas` for PDF export | **Keep (correctly code-split)** |
| `lucide-react` | `^1.8.0` | Icons across 100+ component files; covered by `optimizePackageImports` in `next.config.ts` | **Keep** |
| `mermaid` | `^11.15.0` | Dynamically imported in `MermaidDiagram.tsx` (help content) and used by `ArchitectureDiagramViewer.tsx` | **Keep (correctly code-split)** |
| `next` | `^16.2.10` | Framework | **Keep** |
| `react` / `react-dom` | `^19.2.0` | Framework | **Keep** |
| `react-hook-form` | `^7.72.1` | Form state across ~20 forms/wizards | **Keep** |
| `reactflow` | `^11.11.4` | Architecture/graph viewer (`GraphViewer.tsx`, `ArchitectureGraphViewer.tsx`, etc.); explicitly listed in `transpilePackages` | **Keep** |
| `recharts` | `^3.9.1` | Exactly one consumer (`ExecutiveRoiSystemicIssueTrendChart.tsx`), loaded via `next/dynamic` on the sponsor ROI section — **and this exact constraint is enforced by a repository test** (`src/lib/recharts-import-policy.test.ts`, TB-570) | **Keep — exemplary governance pattern** |
| `server-only` | `^0.0.1` | Import-time guard in ~10 server-only modules (`server-run-scope.ts`, `server-current-principal.ts`, access-request server modules, etc.) | **Keep** |
| `sonner` | `^2.0.7` | Toast system (`toast.ts`, `AppToaster.tsx`, `api-error-toast.tsx`) | **Keep** |
| `tailwind-merge` | `^2.6.0` | `src/lib/utils.ts` (`cn()` helper) | **Keep** |
| `toml` | `^3.0.0` | `src/lib/second-run-paste.ts` | **Keep (single, narrow use — watch for drift)** |
| `web-vitals` | `^4.2.4` | `web-vitals-reporter.ts` (Core Web Vitals reporting; distinct from Application Insights) | **Keep** |
| `zod` | `^4.3.6` | Schema validation across 8+ form/validation modules | **Keep** |

**Direct production dependencies demonstrably used:** 35 of 39 (90%).
**Direct production dependencies with no evidence of use:** `@microsoft/applicationinsights-react-js`, `ajv`, `ajv-formats` (3 of 39).

---

## 5. Direct development dependency inventory

26 entries in `devDependencies`. All 26 have confirmed usage — **no unused devDependencies were found.**

| Package | Version | Repository usage |
|---|---|---|
| `@axe-core/playwright` | `^4.11.1` | `e2e/helpers/axe-helper.ts`, `tests/accessibility.spec.ts` |
| `@eslint/eslintrc` | `^3.2.0` | `eslint.config.mjs` (legacy-config compatibility import) |
| `@lhci/cli` | `^0.14.0` | `scripts/run-lighthouse-ci.mjs`, `lighthouserc.cjs`, `lighthouse:ci` script |
| `@next/bundle-analyzer` | `^16.2.10` | `next.config.ts` (`ANALYZE=1`/`true` gate) |
| `@playwright/test` | `^1.49.0` | All 5 Playwright configs; every `e2e/*.spec.ts` |
| `@testing-library/dom` | `^10.4.1` | Transitive peer for RTL; used implicitly by `@testing-library/react` |
| `@testing-library/jest-dom` | `^6.9.1` | `vitest.setup.ts` matcher extensions |
| `@testing-library/react` | `^16.3.2` | Hundreds of `*.test.tsx` files |
| `@types/jest-axe` | `^3.5.9` | Type support for `jest-axe` |
| `@types/node` | `^22.10.0` | Global Node typings |
| `@types/react` / `@types/react-dom` | `^19.0.0` | React 19 typings |
| `@vitejs/plugin-react` | `^6.0.1` | `vitest.config.ts` |
| `autoprefixer` | `^10.4.20` | `postcss.config.mjs` |
| `eslint` | `9.39.4` (pinned exact; also pinned via `overrides`) | Repo-wide lint |
| `eslint-config-next` | `^16.2.10` | `eslint.config.mjs` |
| `jest-axe` | `^10.0.0` | ~25 accessibility test files (`src/accessibility/*.test.tsx` and co-located component tests) |
| `jsdom` | `^29.0.1` | `vitest.config.ts` test environment |
| `openapi-typescript` | `^7.13.0` | `generate:api-types` script, and reused inside `packages/api-types` |
| `openpgp` | `^6.3.0` | Single script: `scripts/security/generate-coordinated-disclosure-pgp.mjs` |
| `postcss` | `^8.5.10` | `postcss.config.mjs` |
| `sharp` | `^0.34.5` | `scripts/generate-brand-raster.mjs` (build-time only; also has a native install script — expected) |
| `tailwindcss` | `^3.4.17` | `tailwind.config.ts`, `postcss.config.mjs` |
| `tsx` | `^4.19.0` | Node-script runner: `sync:glossary`, `build:docs-pdf`, and Playwright's live-server bootstrap |
| `typescript` | `^5.9.3` | Type-checking (`tsc --noEmit`), build |
| `vitest` | `^4.1.2` | Unit/component test runner |

---

## 6. Unused-dependency findings

Method used (deliberately **not** a plain "grep for import and stop" check — see §21 for full methodology):

1. Static `from "<pkg>"` import search across the whole `archlucid-ui/` tree (src, scripts, e2e, tests, config files).
2. Dynamic-import search (`import("<pkg>")`) for anything not caught by (1).
3. Cross-reference against every config file already read in this assessment (`next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `components.json`, all 5 Playwright configs, `lighthouserc.cjs`).
4. Cross-reference against every `package.json` script (build/test/lint/generate/security chains).
5. For any dependency still showing zero hits, a broader unscoped keyword search (class names, e.g. `new Ajv`, `ReactPlugin`) to rule out unconventional import styles.

**Findings:**

| Package | Status | Confidence | Notes |
|---|---|---|---|
| `@microsoft/applicationinsights-react-js` | **Unused** | High | Zero hits under any search strategy above. The app implements route tracking via `enableAutoRouteTracking: true` passed directly to the base `applicationinsights-web` config, which fully substitutes for this plugin's purpose. |
| `ajv` | **Unused** | High | Zero hits. Not a transitive necessity of any other **direct** dependency — it is only required transitively by `ajv-formats` (also unused) and by `eslint`'s own toolchain at a *different* major version (6.x, already present regardless — see §7). |
| `ajv-formats` | **Unused** | High | Zero hits; exists solely to extend the unused `ajv`. |

No other direct dependency showed zero evidence of use. `@archlucid/api-types` and `toml` have narrow (single- or few-file) usage but are legitimately, demonstrably used — narrow usage is not the same as unused, and the task instructions explicitly warn against conflating the two.

---

## 7. Redundant-library findings

Checked explicitly for each family called out in the assessment brief:

| Family | Finding |
|---|---|
| Component libraries | One system (Radix primitives + shadcn generation convention). No MUI/Chakra/Ant/Headless UI duplicate. |
| Icon libraries | One (`lucide-react`). No react-icons/heroicons/FontAwesome duplicate. |
| Date libraries | **None present.** No date-fns/dayjs/moment/luxon in the dependency tree at all — nothing to consolidate. |
| Validation libraries | `zod` is the only one in active use. `ajv`/`ajv-formats` are present in the manifest but **unused**, not a second active validation stack — this is a removal candidate (§6), not a consolidation candidate. |
| HTTP clients | None beyond the platform `fetch` API, wrapped by `@tanstack/react-query`. No axios/ky/superagent. |
| State-management systems | `@tanstack/react-query` for server state. No Redux/Zustand/Jotai/Recoil client-state library present — component-local `useState`/context appears to be the convention for client state. Single, coherent approach. |
| Form libraries | `react-hook-form` + `@hookform/resolvers` (schema-integrated with `zod`). No Formik/React Final Form duplicate. |
| Charting libraries | `recharts` only, and its blast radius is already limited to one file by an enforced test (§4). No visx/nivo/chart.js duplicate. |
| Markdown/rich-text systems | No markdown-rendering package (`react-markdown`, `remark`, etc.) in the dependency list; `HelpMarkdownCodeBlock`/help content appear to use bespoke, narrowly-scoped rendering rather than a general-purpose library. Nothing to consolidate. |
| Testing frameworks | Vitest (unit/component) + Playwright (E2E/visual/accessibility) — two frameworks, but for two genuinely different test types; this is a standard, justified split, not duplication. |
| CSS utilities | Tailwind CSS v3 only. No styled-components/Emotion/CSS-in-JS competitor. |
| Authentication clients | None in this package.json — authentication/session concerns are server-mediated against the .NET API, not implemented via a client-side npm auth SDK. |

**Conclusion: this codebase does not exhibit the "disproportionate complexity from overlapping libraries" pattern the assessment brief warns about.** The only finding in this category is the dormant `ajv`/`ajv-formats` pair, which is a removal item, not a consolidation item.

---

## 8. Duplicate-version findings

75 package **names** resolve to more than one **version** simultaneously in the lockfile. This is normal for a graph this size (each independent tool pins its own transitive ranges) and is **not automatically a defect** — the assessment traced the highest-signal cases to their root cause:

| Package | Versions present | Introduced by | Root cause | Fixable without a major upgrade? |
|---|---|---|---|---|
| `ajv` | `6.15.0`, `8.20.0` | `eslint` / `@eslint/eslintrc` → `6.15.0`; `ajv-formats` (itself unused) → `8.20.0` | Two independent consumers pin different majors | **Yes** — removing the unused `ajv`/`ajv-formats` direct dependency eliminates the `8.20.0` branch entirely, leaving only ESLint's `6.15.0` (see §14, Tier 1) |
| `react-is` | `16.13.1`, `17.0.2`, `18.3.1` | `prop-types` → `16.x`; several `pretty-format` copies nested inside `jest-axe`/`@types/jest` → `17.x`/`18.x`; `recharts` → broad `16‖17‖18‖19` range | Independent Jest-ecosystem forks each vendoring their own `pretty-format`, plus one legacy `prop-types` consumer | No — would require upstream coordination across unrelated test-tooling packages; dev-only, disk-only cost, no functional or bundle risk |
| `semver` | `5.7.2`, `6.3.1`, `7.7.4` | `@babel/core` (6.x), `eslint-plugin-import`/`eslint-plugin-react` (6.x), `lighthouse` (5.x), `@typescript-eslint/typescript-estree`/`@puppeteer/browsers` (7.x) | Each independent build/lint/perf tool pins its own range | No — extremely common, extremely low risk, not worth forcing |
| `lightningcss`, `@rolldown/binding-*`, `esbuild` | multiple | All transitively required by `vite@8.0.16` (pinned via `package.json` `overrides`), itself only a transitive dependency of `vitest`/`@vitejs/plugin-react` | Vite is Vitest's internal dev-server/transform engine — **never touches the Next.js production build or the browser bundle** | Not applicable — dev/test-only |
| `@img/sharp-*` platform packages | one entry per OS/arch (all `optionalDependencies` of `sharp`) | `sharp` (direct devDependency) | npm lists every platform variant in the lockfile; only the one matching the current OS/arch is actually downloaded | Not applicable — this is npm's normal cross-platform optional-dependency mechanism, not real duplication |

**On forcing resolutions:** the repository already uses `package.json` `overrides` for 10 packages (`eslint`, `vite`, `lodash-es`, `dompurify`, `uuid`, `postcss`, `undici`, `js-yaml`, `esbuild`, `tmp`, `cookie`) — almost certainly security/consistency pins applied after prior review. This assessment found no compatibility evidence to justify **adding** further overrides beyond removing the two unused packages above; per the task's explicit instruction, no broad version-override recommendation is made.

---

## 9. Largest dependency subtrees (disk footprint, evidence-based)

Measured directly from installed `node_modules/` (Windows x64): **~967 MB total, 67,865 files, 1,236 resolved package/version nodes.**

| Package (top-level `node_modules` entry) | Size on disk | Direct/transitive | Bundle relevance |
|---|---|---|---|
| `next` | 155.1 MB | direct (framework) | Server + build-time; only a slice reaches the client (Next's own client runtime) |
| `@next/swc-win32-x64-msvc` | 136.9 MB | transitive (platform-specific native compiler binary) | **Build/dev-time only** — never ships to the browser or even to the deployed server bundle beyond the compiler itself |
| `mermaid` (+ `@mermaid-js/parser` 11.5 MB, `cytoscape-fcose` 9.3 MB layout engine) | 76.3 MB (+ ~21 MB deps) | direct | **Dynamically imported** — ships only to the specific help/architecture-diagram route that renders it |
| Application Insights suite (`applicationinsights-web` 38.8 MB + `-channel-js` 19.7 MB + `-core-js` 18.6 MB + `-properties-js` 12.5 MB + `-cfgsync-js` 11.5 MB + `-analytics-js` 9.8 MB + `-dependencies-js` 9.0 MB + `@nevware21/ts-utils` 16.2 MB + `@nevware21/ts-async` 8.7 MB) | ~145 MB combined | direct (`applicationinsights-web`) + transitive | **Dynamically imported** — telemetry SDK loads only after a connection string is configured, never blocks initial render |
| `jspdf` (+ `canvg`/`core-js` for its internal SVG-to-canvas support) | 30.2 MB | direct | **Dynamically imported** in export features only |
| `lucide-react` | 29.8 MB | direct | On-disk size reflects the full icon set; `optimizePackageImports` + per-icon module resolution mean **only imported icons** reach the bundle |
| `typescript` | 23.6 MB | dev | Build/typecheck only |
| `@rolldown/binding-win32-x64-msvc` | 23.5 MB | transitive (via `vite`, via `vitest`) | Dev/test-only |
| `@img/sharp-win32-x64` | 19.9 MB | transitive (native binding for the `sharp` devDependency) | Build-time only (brand raster script) |
| `lighthouse` (+ `chromium-bidi` 8.6 MB, `puppeteer-core` 6.9 MB) | 18.4 MB (+ ~15.5 MB) | transitive (via `@lhci/cli`) | Dev/CI-only |
| `openpgp` | 17.3 MB | direct | Dev-only, single script |
| `lightningcss-win32-x64-msvc` | 9.5 MB | transitive (via `vite`) | Dev/test-only |
| `playwright-core` | 9.3 MB | transitive (via `@playwright/test`) | Dev/E2E-only |
| `recharts` | 7.3 MB | direct | Dynamically imported, single consumer |
| `react-dom` | 7.3 MB | direct | Framework — genuinely ships to the client (this is expected and unavoidable) |
| `jsdom` | 6.9 MB | dev | Test environment only |

**Takeaway:** by disk size, the largest subtrees are dominated by (a) the Next.js compiler's platform-specific native binary, (b) a telemetry SDK and a diagramming library that are both correctly dynamically loaded, and (c) test/build tooling (TypeScript, Vite's native binaries, Lighthouse/Puppeteer, sharp). None of the top 10 by disk size represents an unmanaged browser-bundle risk.

---

## 10. Browser-bundle analysis

**Distinguishing the metrics** (per task instructions, dependency-graph size ≠ install size ≠ build time ≠ server bundle size ≠ browser bundle size ≠ initial JS ≠ route JS ≠ runtime performance):

- **Dependency graph size:** 1,236 nodes (§2) — irrelevant to browser performance by itself.
- **Install size:** ~967 MB (§9) — affects CI cache/checkout time and Docker build-stage duration, not what a browser downloads.
- **Browser bundle / First Load JS (real, measured):** from `performance/first-load-js-baseline.v1.json` (refreshed 2026-07-12, same day as this assessment, via `npm run build && npm run write:first-load-js-baseline`):

  | Route | First Load JS | Regression tolerance |
  |---|---|---|
  | `/welcome` | 724.9 KB | ±25 KB |
  | `/governance` | 1,399.9 KB | ±25 KB |
  | `/reviews` | 1,633.0 KB | ±25 KB |
  | `/reviews/[runId]` | 2,150.9 KB | ±25 KB |

  This baseline is already tracked by a repository script (`check:first-load-js`, reading `.next/diagnostics/route-bundle-stats.json` on Next 16+) with an enforced ±25 KB regression budget — **this is a real, working governance mechanism**, not a gap this assessment needs to invent from scratch.

**Mitigations already in place** (evidence, not assumption):

- `next.config.ts` → `experimental.optimizePackageImports` explicitly lists `lucide-react`, `recharts`, and all 9 `@radix-ui/react-*` packages — this defeats the classic "barrel import defeats tree-shaking" problem for exactly the packages most likely to suffer from it.
- `transpilePackages: ["reactflow"]` — required because `reactflow` ships module formats Next's default transform doesn't handle; this is a correctness setting, not a bloat source.
- `mermaid`, `html2canvas`, `jspdf`, `@microsoft/applicationinsights-web` are all loaded via `await import(...)` inside effects/handlers — confirmed by direct source inspection (§4) — so **none of these appear in the initial or shared bundle**; each loads only when its owning route/feature is used.
- `recharts` has a **repository-enforced, test-verified** single-import-site + `next/dynamic` policy (`src/lib/recharts-import-policy.test.ts`, TB-570) that would fail CI if anyone reintroduced a static import or a second import site. This is a strong, reusable governance pattern (see §19).

**Open questions this assessment could not resolve without a fresh instrumented build (out of scope — would require an `ANALYZE=1 npm run build`, a Slow-tier operation not requested and not run):**

- The exact chunk composition behind `/welcome`'s 724.9 KB and `/reviews/[runId]`'s 2,150.9 KB First Load JS figures (i.e., which specific modules are in the shared vs. route-specific chunks). 724.9 KB for a marketing landing page is on the high side for a from-scratch Next.js app (typical guidance targets are well under this), though not unusual for an enterprise app-shell that shares chrome/navigation code with the operator product. `/reviews/[runId]` at 2.1 MB is the single largest route and, since Next's "First Load JS" metric already excludes purely `dynamic()`-loaded chunks, its size implies a meaningful amount of **synchronously-imported** route code that has not yet been pushed behind a `dynamic()` boundary the way `recharts`/`mermaid`/`jspdf` have been. This is flagged as a Tier 3 investigation candidate (§15), not diagnosed further here.
- Whether any barrel-imported package without an `optimizePackageImports` entry (e.g., a future large dependency) would silently regress tree-shaking — the existing allowlist approach requires someone to remember to add new large packages to it; see governance recommendations (§19).

**Server-capable work shipped to the client:** none identified. `server-only` is actively used as an import guard on ~10 modules, and the packages that would be classic candidates for accidental client leakage (`@azure/communication-email`, server-side validation/rate-limit modules) are confined to `src/lib/server/` and `server-*.ts` files gated by the `server-only` import guard.

---

## 11. Server-bundle analysis

- **Standalone output** (`output: "standalone"` in `next.config.ts`) means the deployed server artifact is a Next-traced subset of `node_modules`, not the full 967 MB dev install — file-tracing keeps only packages actually reachable from server code paths.
- Genuinely server-only direct dependencies: `@azure/communication-email` (transactional email), `server-only` (the guard package itself, zero runtime code). Both are absent from any client bundle by construction (Node-only APIs / import-time throw guard).
- The Application Insights suite and `mermaid`/`jspdf`/`html2canvas` are **client-only** dynamic imports (browser APIs: `window`, `document`, `canvas`) — they do not appear in the server runtime bundle at all, only in client chunks.
- No evidence of Node-only packages being imported from a Client Component boundary that is too broad (the classic "server-capable work shipped to the client" failure mode) — the `server-only` guard usage pattern appears to be applied deliberately and consistently for the modules that need it.

---

## 12. Vulnerability and reachability analysis

`npm audit --json` was run against the current lockfile (registry-connected, point-in-time):

```
"metadata": {
  "vulnerabilities": { "info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0 },
  "dependencies": { "prod": 306, "dev": 912, "optional": 124, "peer": 1, "peerOptional": 0, "total": 1236 }
}
```

**Result: zero known vulnerabilities at any severity across the entire 1,236-node graph** at the time of this assessment.

Because there were zero findings, the reachability framework requested by the task (production-reachable / dev-only / build-time-only / test-only / false-positive) has **no findings to classify**. This is recorded as a point-in-time result, not a permanent guarantee — the advisory database changes daily, and this repository has no automated recurring `npm audit` check in CI today (see governance recommendations, §19, for closing that gap without introducing bureaucracy).

**Install-script inventory** (supply-chain risk surface — packages that execute code during `npm install`):

| Package | Reason | Risk assessment |
|---|---|---|
| `sharp` | Compiles/fetches native `libvips` binding | Expected and required for the direct devDependency's stated purpose (brand raster generation) |
| `esbuild` | Fetches its own platform binary | Standard, widely-audited pattern; transitive via `tsx`/`vite` |
| `core-js` | Well-known benign postinstall (donation/funding notice); transitive of `jspdf`/`canvg` | Low risk, cosmetic |
| `unrs-resolver` | Native resolver binary; transitive of `eslint-import-resolver-typescript` | Lint-time only |
| `fsevents` (×3 nested copies) | macOS-only optional file-watcher; no-op on Windows/Linux | No risk on this platform |

No install-script package was found that lacked a clear, traceable purpose.

---

## 13. License analysis

Aggregated from the `license` field recorded for each of the 1,236 lockfile nodes:

| License | Count |
|---|---|
| MIT | 989 |
| ISC | 88 |
| Apache-2.0 | 64 |
| BSD-3-Clause | 24 |
| MPL-2.0 | 16 |
| BSD-2-Clause | 14 |
| **LGPL-3.0-or-later / LGPL-3.0+** | **11** |
| 0BSD | 7 |
| CC0-1.0 / MIT-0 / BlueOak-1.0.0 / other permissive | ~8 |
| No license field recorded | 3 |
| Other single-package oddities (WTFPL/MIT dual, Unlicense, custom-file reference) | 4 |
| `UNLICENSED` (the internal workspace package itself) | 1 |

**LGPL detail (the only copyleft family present):** all 11 LGPL-tagged nodes are either (a) `@img/sharp-libvips-*` and `@img/sharp-win32-*` — native binary bindings that are **optionalDependencies of `sharp`, a devDependency used only by a build-time brand-image script**, never linked into the shipped application code, or (b) `openpgp` itself — a **devDependency used by exactly one CLI script** (`generate-coordinated-disclosure-pgp.mjs`), never shipped to end users. Because neither is distributed as part of the compiled application (they run at build time / in a standalone maintainer script), LGPL's source-availability obligations are not triggered by ArchLucid's distribution model. **No action required**, but this reasoning should be preserved if either package's usage ever changes (e.g., if `sharp`-based image processing moved into a runtime API route).

**No-license-field packages** (`@archlucid/api-types` — the internal package, whose own `package.json` correctly declares `"license": "UNLICENSED"`, just not propagated into this lockfile field; `khroma`, `parse-cache-control` — small transitive dependencies of `mermaid`/Lighthouse with missing `license` metadata upstream, not flagged as OSS-license violations, but their absence of a machine-readable license field is itself a minor provenance gap worth tracking if a license-scanning tool is ever added to CI).

**Overall: no restrictive or GPL-family (strong copyleft) licenses were found anywhere in the graph.** The license posture is compatible with proprietary distribution.

---

## 14. Maintenance and abandonment risks

No packages were found with an unusually small/inactive maintainer base beyond what's inherent to a few narrow-purpose direct dependencies:

| Package | Signal | Assessment |
|---|---|---|
| `toml` | Single, narrow direct dependency (config-paste parsing) with a small ecosystem footprint | Low usage surface makes this an easy future swap if maintenance ever lapses; not currently a problem |
| `diff` | Long-lived, low-churn utility package; stable API | No concern |
| `fflate` | Actively used, purpose-built zip library; well-regarded, single-maintainer-style project but heavily used industry-wide | No concern |
| `cmdk` | Smaller maintainer base than Radix itself, but standard choice for command-palette UX alongside Radix Dialog | No concern |

No direct dependency was found pinned to an **obsolete major version** relative to what the rest of the graph expects (React 19, Next 16, ESLint 9, Vitest 4 are all current-generation majors, consistently applied). No direct dependency has multiple major versions installed simultaneously (the multi-version cases in §8 are all transitive-only).

---

## 15. Safe-removal candidates (Tier 1)

Direct dependencies with strong evidence of no usage and low hidden-coupling risk:

| Package | Evidence of non-use | Estimated effect |
|---|---|---|
| `@microsoft/applicationinsights-react-js` | Zero references anywhere in `src/`, scripts, tests, or config; route tracking already implemented via `enableAutoRouteTracking` on the base SDK | Removes 1 direct dependency + its private transitive subtree; **zero bundle effect** (nothing imports it today, so it was already excluded from every bundle); frees ~1 disk-footprint node; slightly reduces `npm install` and audit surface |
| `ajv` | Zero references anywhere in source; not required by any *other* direct dependency | Removes 1 direct dependency; eliminates the `ajv@8.20.0` branch from the duplicate-version list (§8) once `ajv-formats` is also removed; **zero bundle effect** (never imported); ESLint's own `ajv@6.15.0` requirement is untouched and continues to satisfy ESLint's needs |
| `ajv-formats` | Zero references anywhere in source; exists only to extend the also-unused `ajv` | Same package as above — remove together |

**Validation required before removal (small, bounded, per package):**
1. Remove the entry from `dependencies` in `package.json`.
2. Run `npm install` to regenerate the lockfile (no other manifest changes).
3. Run `npm run typecheck`, `npm run lint`, `npm run test`, and a scoped `npm run build` to confirm nothing broke (these three packages showing zero static/dynamic import hits means none of these commands should reference them, but the build/typecheck step also catches any residual `@types/*` or config reference this assessment's search patterns might have missed).
4. Diff `package-lock.json` to confirm only the expected nodes were removed (no unrelated transitive packages should disappear, since nothing else in the direct-dependency set relies on these three).

**Regression risk: low.** These are the textbook "safe removal" case the task defines — no hidden coupling was found through any of the required alternate-usage-path checks (dynamic imports, configs, scripts, plugins, CSS, generated code, test setup, Storybook — not present in this repo, Playwright, lint config, build config, package-manager scripts).

---

## 16. Consolidation candidates (Tier 2 / Tier 3)

**Tier 2 (redundant/replaceable, needs targeted validation):** none identified with meaningful evidence. As shown in §7, this codebase does not have overlapping-library duplication to consolidate. The closest candidate is `ajv`/`ajv-formats`, but that is a **Tier 1 removal** (fully unused), not a Tier 2 consolidation (nothing to consolidate it *into* — it has no active counterpart doing the same job).

**Tier 3 (architectural consolidation opportunity — larger effort, real but not urgent):**

| Opportunity | Rationale | Estimated effort/risk |
|---|---|---|
| Investigate `/reviews/[runId]`'s 2,150.9 KB First Load JS composition | This is the single largest tracked route and, unlike `mermaid`/`recharts`/`jspdf`, its size is not obviously explained by a library that's already dynamically loaded — meaning some synchronously-imported route code is a candidate for the same `next/dynamic` treatment already proven out for `recharts` (TB-570) | Medium effort (requires an `ANALYZE=1` build + manual chunk inspection), low regression risk if changes are limited to wrapping existing components in `next/dynamic` without altering their logic |
| Extend the `recharts`-style "single import site + enforced dynamic-load test" pattern to `reactflow` and `@tanstack/react-virtual`-backed heavy tables | These are the next-largest bundle-relevant direct dependencies without an equivalent enforced policy; codifying the existing informal discipline protects against future regressions as more contributors touch these files | Low effort per package (write one policy test per package, modeled directly on `recharts-import-policy.test.ts`); zero behavior change, pure test addition |
| Formalize `optimizePackageImports` maintenance | The allowlist in `next.config.ts` is manually curated; add a lightweight CI reminder (not a gate) when a new large direct dependency is added without a corresponding entry | Low effort, governance-only (§19) |

None of these require replacing a framework or rewriting a feature — they are refinements of a pattern the codebase has already proven works (§4, `recharts`).

---

## 17. Dependencies that should remain (Tier 4 — keep)

All 35 used production dependencies (§4) and all 26 development dependencies (§5) beyond the 3 Tier-1 removals. In particular, explicitly **do not** treat the following as removal targets despite their size or transitive-dependency count, because each is justified and correctly scoped:

- `mermaid`, `jspdf`, `html2canvas`, `@microsoft/applicationinsights-web` — large, but dynamically imported; removing them would remove real features (diagram rendering, PDF/PNG export, telemetry), and their current loading strategy already minimizes bundle impact.
- `reactflow`, `recharts` — large-ish, single-purpose, single or few consumers, and (for `recharts`) already policy-enforced.
- `next`, `react`, `react-dom`, `typescript`, `eslint`, `vitest`, `@playwright/test` — foundational framework/tooling; their transitive-dependency counts are a function of the Next.js/ESLint 9/Vitest/Playwright ecosystems, not a choice ArchLucid made poorly. Replacing any of them "to reduce package count" would be a regression, not an improvement, per the task's explicit caution against this.
- `sharp`, `openpgp`, `@lhci/cli` — narrow, single-script, build/CI-only tools; each has a specific documented purpose and no overlap with anything else in the graph.

---

## 18. Estimated benefits and risks (rolled up)

| Action | Packages removed from graph | Install-size effect | Browser-bundle effect | Security effect | Maintenance effect | Effort | Regression risk |
|---|---|---|---|---|---|---|---|
| Remove `@microsoft/applicationinsights-react-js` | 1 direct + its private subtree (exact transitive count depends on whether any of its deps are shared elsewhere — likely small, package has few own dependencies) | Small reduction | **None** (never bundled) | Marginal (smaller audit surface) | Marginal (one fewer package to track upgrades for) | Very low | Very low |
| Remove `ajv` + `ajv-formats` | 2 direct + the private `ajv@8.20.0` transitive branch (collapses one of the two duplicate `ajv` versions from §8) | Small reduction | **None** (never bundled) | Marginal | Marginal | Very low | Very low |
| Add policy tests for `reactflow`/virtualized tables (Tier 3) | 0 (test-only addition, no removal) | None | Protective (prevents future regressions), not immediately reductive | None | Improves (codifies existing tribal knowledge) | Low | Very low (pure test addition) |
| Investigate `/reviews/[runId]` bundle composition (Tier 3) | Unknown until investigated — could be 0 if the size is legitimately needed | None from investigation alone | **Potentially significant** if synchronous code can move behind `dynamic()` | None | None | Medium | Depends on what's found; any *change* would need its own scoped follow-up with before/after First Load JS measurement |

**Adversarial note on cosmetic cleanup (explicitly requested by the task):** removing the 3 Tier-1 packages will shrink `package.json`'s dependency count by 3 and the lockfile's node count by a handful, but **it will not move the "almost 1,200" figure in any way a stakeholder would notice, and it will not change a single byte of any browser bundle**, because none of these three packages were ever reachable from client code. The genuine value of this cleanup is **audit-surface and lockfile hygiene**, not performance or a smaller-sounding package count. Anyone reporting this cleanup as a "bundle size" or "package count" win should be corrected — it is a supply-chain hygiene win only. Conversely, the Tier 3 `/reviews/[runId]` investigation is the one item on this list that could plausibly move a metric a user would feel (First Load JS), and it requires no package removal at all — just import-site refactoring, following a pattern the codebase already uses successfully.

---

## 19. Dependency-governance recommendations

Scoped to avoid inventing a bureaucratic approval process (per task instruction):

1. **Extend the existing `first-load-js-baseline.v1.json` mechanism** (already present and working) to fail CI, not just report, on regressions beyond the ±25 KB tolerance for the 4 tracked routes — confirm whether `check:first-load-js` already gates CI (out of scope to verify further here without reading CI workflow internals beyond what was already checked) or is advisory-only, and close that gap if it's advisory-only. This is the single highest-leverage governance improvement because the measurement infrastructure already exists.
2. **Codify the `recharts` import-policy pattern (TB-570) as a reusable test helper** rather than one-off, and apply it to `reactflow` and `mermaid` as the next two highest-value candidates (both already dynamically loaded in practice — this only adds a regression guard, no behavior change).
3. **Lightweight new-direct-dependency checklist** (PR description prompt, not a gate): when adding a direct dependency, note (a) why an existing dependency can't satisfy the need, (b) whether it ships to the client or server only, and (c) whether it needs a Tier-3-style dynamic-import guard. This can live in a PR template or CONTRIBUTING note — no new tooling required.
4. **Add a recurring (not per-PR) `npm audit` check** — e.g., a weekly scheduled CI job — since none currently exists in an automated recurring form; today's "zero vulnerabilities" result is only as good as the day it was run.
5. **Pin `engines.node` in `archlucid-ui/package.json`** to match the Node 22 convention already enforced by Dockerfile/CI, closing the minor gap noted in §3 (currently only the workspace member declares an `engines` field, and it's looser than reality).
6. **Do not** add a manual approval workflow, a dependency czar role, or a package-count budget — none of these fit a team already demonstrating good bundle discipline (§10) and would add friction disproportionate to the actual risk observed in this assessment.

---

## 20. Recommended phased cleanup plan

**Phase 1 (this week, near-zero risk):**
- Remove `@microsoft/applicationinsights-react-js`, `ajv`, `ajv-formats` (§15). Three independent, reversible, single-commit changes — land them separately so any unexpected CI failure isolates to one package.

**Phase 2 (next sprint, test-only, zero behavior change):**
- Add `reactflow` and `mermaid` import-policy tests modeled on `recharts-import-policy.test.ts` (§16, §19).
- Pin `engines.node` (§19).

**Phase 3 (planned investigation, not a commitment to change code):**
- Run one `ANALYZE=1 npm run build` and inspect the `/welcome` and `/reviews/[runId]` chunk composition. Produce a short follow-up note listing concrete `dynamic()` candidates, if any, before writing any implementation prompt for them.

**Explicitly not recommended in any phase:** deleting/regenerating the lockfile from scratch, `npm audit fix --force`, adding new `overrides` beyond what's already present, replacing `mermaid`/`reactflow`/`recharts`/Application Insights with lighter alternatives, or merging `dependencies`/`devDependencies`.

---

## 21. Commands and evidence used

All commands were read-only / non-mutating (no `--save`, no version changes, no lockfile regeneration except the ajv/appinsights removal validation steps described in §15, which were **not executed** — they are proposed validation steps for a future change, not part of this assessment):

```powershell
# Lockfile shape confirmation
Select-String -Path archlucid-ui\package-lock.json -Pattern '"lockfileVersion"'
Get-Item archlucid-ui\package-lock.json | % Length
Test-Path archlucid-ui\node_modules

# Lockfile parse: total nodes, unique names, dev/prod/optional/peer flags, duplicate-version names
node -e "... JSON.parse(readFileSync('package-lock.json')) ... " # see §2, §8

# Install footprint measurement
Get-ChildItem -LiteralPath node_modules -Recurse -File | Measure-Object -Property Length -Sum
# Per-top-level-package size ranking (handles @scope/* nesting)
Get-ChildItem -LiteralPath node_modules -Directory | ForEach-Object { ... } | Sort-Object Bytes -Descending

# Vulnerability scan (registry-connected, point-in-time)
npm audit --json

# Install-script and license aggregation (from lockfile metadata, no install performed)
node -e "... hasInstallScript / license fields ..."

# Duplicate-version root-cause tracing (who depends on which version)
node -e "... scan packages[].dependencies for ajv/react-is/semver/lightningcss/vite/etc. ..."
```

Static/dynamic-import evidence (per direct dependency) was gathered via repository-wide regex search for `from ["']<pkg>["']` and `import\(["']<pkg>["']\)` across `archlucid-ui/` (excluding `node_modules`), cross-referenced against every build/test/lint config file and every `package.json` script, per the methodology required by the task (not a single naive grep pass — dynamic imports, configs, and scripts were checked as separate, explicit steps for every package that showed zero hits on the first pass).

Configuration files read in full: `package.json` (both the app and `packages/api-types`), `package-lock.json` (parsed programmatically), `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `components.json`, `playwright.config.ts` (+ 4 sibling configs by name), `performance/first-load-js-baseline.v1.json`, `archlucid-ui/AGENTS.md`, `archlucid-ui/Dockerfile`, root `package.json`, and relevant `.github/workflows/*.yml` Node-version pins.

**Tools deliberately not installed or run:** Knip, depcheck, `npm-check-updates`/`npm outdated`, and a fresh `ANALYZE=1` bundle-analyzer build were **not** run, per the task's instruction to prefer temporary execution or static analysis and avoid permanently installing new tooling; the manual multi-signal methodology above was used as the substitute and is recorded as such in §22 uncertainties.

---

## 22. Uncertainties requiring manual confirmation

- **Knip/depcheck cross-validation not performed.** This assessment's unused-dependency findings (§6) rest on manual, multi-signal tracing (static imports, dynamic imports, configs, scripts) rather than an automated tool run, per the task's caution against installing new tooling mid-assessment. Recommend running `npx knip` and/or `npx depcheck` once (temporary execution, nothing to commit) as a cheap cross-check before merging the Phase 1 removals in §20 — if they surface additional candidates beyond the 3 found here, treat those as new Tier 2 candidates requiring their own targeted validation, not as automatically safe.
- **`npm audit`'s zero-vulnerability result is a point-in-time snapshot** taken against the live registry on 2026-07-12; re-run immediately before relying on it for any compliance artifact.
- **`/welcome` (724.9 KB) and `/reviews/[runId]` (2,150.9 KB) First Load JS composition is not chunk-level diagnosed** in this assessment — doing so requires a fresh `ANALYZE=1` build, which was out of scope (Slow-tier, not requested). §16/§20 Phase 3 proposes this as a follow-up investigation, not a conclusion.
- **Whether `check:first-load-js` is wired as a blocking CI gate or an advisory/manual script** was not independently re-verified beyond reading the script's existence and its documented usage in `AGENTS.md`; confirm before treating it as a hard regression gate in the governance recommendation (§19 item 1).
- **Exact per-package transitive-node counts removed by the Tier 1 changes** (§15/§18) are estimated qualitatively ("a handful," "the `ajv@8.20.0` branch") rather than measured before/after, since doing so would require actually performing the removal and re-running `npm install` — which this assessment was instructed not to do. Measure precisely as part of the Phase 1 validation steps in §15.
- **`toml` and `diff`** have narrow, single-file usage; confirmed as legitimately used, but their long-term necessity should be revisited if the features that use them (`second-run-paste.ts`, `architecture-manifest-line-diff.ts`) are ever removed or rewritten — not a current concern, just a note for future maintainers.

---

## 23. Final recommendation

**Targeted cleanup.**

- **Not "no action":** three direct dependencies (`@microsoft/applicationinsights-react-js`, `ajv`, `ajv-formats`) have strong, multi-signal evidence of being unused and should be removed with the bounded, independently-reversible steps in §15/§20 Phase 1.
- **Not "substantial cleanup":** there is no broad pattern of unused, redundant, or duplicated libraries in this dependency graph (§6, §7). The ~1,200-package figure is overwhelmingly legitimate transitive tooling, not accumulated cruft.
- **Not "architectural consolidation":** no framework, component library, or major dependency family needs replacing. The one Tier 3 item identified (`/reviews/[runId]` bundle composition) is a bundle-optimization investigation using patterns the codebase already has proven (dynamic imports, policy tests) — it is a refinement, not a rearchitecture.

The dependency graph's size is explained, not alarming; the browser-bundle discipline is already good and already measured; the one real gap (two unused packages plus their dead-weight companion) is small, safe, and worth fixing precisely because it's cheap — not because it meaningfully changes any metric that matters to users.

---

## 24. Proposed Cursor implementation prompts

**Backlog tracking:** **TB-858**–**TB-865** in [`docs/library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md); bundle re-audit **TB-697** (refreshed, unblocked).

Each prompt is scoped to one bounded issue, preserves behavior, is independently reversible, and requires before/after measurement. Run these **sequentially**, one at a time, confirming each is merged/stable before starting the next.

### Prompt 1 — Remove unused `@microsoft/applicationinsights-react-js` (**TB-858**)

> In `archlucid-ui/`, remove the `@microsoft/applicationinsights-react-js` entry from `dependencies` in `package.json`. Run `npm install` to update the lockfile only (no other manifest changes). Before making the change, record the current `node_modules` size (`Get-ChildItem node_modules -Recurse -File | Measure-Object Length -Sum`) and the current `package-lock.json` node count. After the change, run `npm run typecheck`, `npm run lint`, and `npm run test`, then re-measure both numbers and report the delta. Do not touch any other dependency. Do not run `npm run build` unless typecheck/lint/test all pass first.

### Prompt 2 — Remove unused `ajv` and `ajv-formats` (**TB-859**)

> In `archlucid-ui/`, remove both `ajv` and `ajv-formats` from `dependencies` in `package.json` in the same change (they were only used together). Run `npm install` to update the lockfile only. Before the change, grep the lockfile for `"ajv"` and `"ajv-formats"` node entries and record the count and versions present (expect to see `ajv@6.15.0`, from ESLint's toolchain, survive; `ajv@8.20.0` and `ajv-formats` should disappear). After the change, confirm via the same grep that only the ESLint-owned `ajv@6.15.0` branch remains, then run `npm run typecheck`, `npm run lint`, and `npm run test`. Report the before/after lockfile node counts.

### Prompt 3 — Cross-validate with Knip (investigation only, no code change) (**TB-860**) — **Done 2026-07-17**

> In `archlucid-ui/`, run `npx knip` (temporary execution — do not add `knip` to `devDependencies`) and capture its full output to a scratch file outside version control. Compare its unused-dependency findings against the assessment in `docs/architecture/ui_dependency_assessment.md` §6. Report any *additional* candidates it surfaces beyond the three already identified, with the same standard of evidence (check dynamic imports/configs/scripts before concluding something is unused) — do not remove anything based on Knip's output alone without that same manual cross-check. This prompt should produce a short findings note, not a dependency change.

**Closure:** Findings in [`ui_knip_cross_validation_tb860.md`](ui_knip_cross_validation_tb860.md) — Knip reported **no unused production `dependencies`** after TB-858/TB-859; devDependency CLI false positives (`@lhci/cli`) and redundant `@eslint/eslintrc` direct pin documented; no new Tier 1 removals.

### Prompt 4 — Add `engines.node` to the app manifest (**TB-861**) — **Done 2026-07-17**

> In `archlucid-ui/package.json`, add `"engines": { "node": ">=22" }` at the top level, matching the Node 22 convention already enforced by `archlucid-ui/Dockerfile` and the `.github/workflows/*.yml` CI pins. Do not change any dependency versions. Validate with `npm install` (should succeed silently on Node 22) and confirm CI's existing Node setup step is unaffected.

**Closure:** Added `"engines": { "node": ">=22" }` to `archlucid-ui/package.json`; aligns with `node:22-alpine` Dockerfile stages and CI `node-version: "22"`. `npm install` succeeded on Node 22 with no lockfile churn.

### Prompt 5 — Add a `reactflow` import-policy test (TB-570-style) (**TB-862**) — **Done 2026-07-17**

> In `archlucid-ui/src/lib/`, add a new Vitest test modeled directly on the existing `recharts-import-policy.test.ts` pattern, scoped to `reactflow`: assert that `reactflow` is statically imported only from its currently-known consumer module(s) (identify them first by searching `from ["']reactflow["']` across `src/`), and that its owning route/component is loaded via `next/dynamic` where applicable. Do not change any component's import strategy — this is a test-only change that documents and protects the current, already-correct behavior. Run `npm run test` to confirm the new test passes against current code as-is (if it fails, that means the current code does not yet meet the policy — stop and report rather than changing production code to force a pass).

**Closure:** Added `src/lib/reactflow-import-policy.test.ts` (4 tests): reactflow imports confined to `GraphViewer`, `FindingEvidenceGraph`, and type-only `finding-evidence-graph-highlight` / `graph-mapper`; `GraphViewer` dynamic via `GraphInteractiveCanvas` + `ArchitectureGraphViewer`; `FindingEvidenceGraph` dynamic via `FindingEvidenceGraphLazy`; hot-path route modules remain reactflow-free. Vitest pass.

### Prompt 5b — Add a `mermaid` import-policy test (TB-570-style) (**TB-863**) — **Done 2026-07-17**

> In `archlucid-ui/src/lib/`, add a new Vitest test modeled on `recharts-import-policy.test.ts` and `reactflow-import-policy.test.ts`, scoped to `mermaid`: assert that `import("mermaid")` appears only in its currently-known consumer module(s) (search `import\(["']mermaid["']\)` across `src/`), that there are no static `from "mermaid"` imports, that the architecture-diagram path reaches mermaid through the existing deferred `ArchitectureCreatedWorkspace` chunk, and that help markdown renders mermaid only via `MermaidDiagram`. Do not change any component's import strategy — test-only drift guard. Run `npm run test` to confirm.

**Closure:** Added `src/lib/mermaid-import-policy.test.ts` (5 tests): dynamic `import("mermaid")` confined to `ArchitectureDiagramViewer` and `MermaidDiagram`; no static `from "mermaid"` imports; architecture path deferred via `RunDetailArchitectureCreatedWorkspaceDeferred`; help path via `MarketingAccessibilityMarkdownFragment` → `MermaidDiagram`; hot-path route modules remain mermaid-free. Vitest pass.

### Prompt 7 — Weekly scheduled `npm audit` for `archlucid-ui` (**TB-864**) — **Done 2026-07-17**

> Add a recurring (not per-PR) weekly GitHub Actions workflow that runs `npm ci` + `npm audit --json` in `archlucid-ui/`, fails the scheduled job on **high/critical** findings, writes JSON/Markdown artifacts for owner review, and includes unit tests for the audit evaluator. Do not change dependency versions in this prompt.

**Closure:** Added `.github/workflows/ui-npm-audit-weekly.yml` (Mondays 08:00 UTC + `workflow_dispatch`), `scripts/ci/run_ui_npm_audit.py` (fail on high/critical; artifact schema `archlucid.ui-npm-audit-weekly.v1`), and `scripts/ci/tests/test_run_ui_npm_audit.py`. Weekly job is non merge-blocking; closes §19 recommendation 4 gap.

### Prompt 8 — `optimizePackageImports` allowlist drift guard (**TB-865**) — **Done 2026-07-17**

> Extend `archlucid-ui/src/next.config.optimize-package-imports.test.ts` (TB-565) with a drift guard: the `experimental.optimizePackageImports` allowlist must equal `lucide-react` + `recharts` + every installed `@radix-ui/react-*` direct dependency, with no orphans or duplicates. Test-only; do not change `next.config.ts` unless the current allowlist is already wrong.

**Closure:** Extended `next.config.optimize-package-imports.test.ts` with TB-865 drift guard (3 tests): canonical allowlist derived from `package.json`, no non-dependency entries, no duplicates. Vitest pass against current `next.config.ts`.

### Prompt 6 — Measure `/reviews/[runId]` bundle composition (investigation only) (**TB-697**) — **Done 2026-07-18**

> In `archlucid-ui/`, run `npm run build:analyze` (sets `ANALYZE=1` and runs the standard build) and capture the resulting bundle-analyzer HTML report for the `/reviews/[runId]` route. Cross-reference the largest modules in that route's client chunk against `performance/first-load-js-baseline.v1.json`'s recorded 2,150.9 KB figure. Produce a short note listing (a) the top 10 largest modules by size in that route's chunk, (b) which of them are already behind `dynamic()` elsewhere in the app but apparently not on this route, and (c) which appear to have no existing dynamic-import precedent. Do not modify any component's loading strategy in this prompt — it produces a findings list for a future, separately-scoped prompt per candidate.

**Closure:** Findings in [`reviews_run_detail_bundle_composition_tb697.md`](reviews_run_detail_bundle_composition_tb697.md). Committed baseline **2,211.1 kB** (RC11); static import/deferred-chunk inventory post-TB-697 engineering pass. Local `build:analyze` blocked (docs-pdf/dotnet + dirty-tree `demo` import); prioritized follow-ups: defer `ArchitectureCreateWorkItemSection` / `ArchitectureSponsorSharingPanel`, then remeasure on CI. No production import changes in this prompt.
