# UI dependency assessment — Knip cross-validation (TB-860)

> **Scope:** Contributor investigation artifact; not buyer/operator documentation.  
> **Date:** 2026-07-17  
> **Command:** `npx --yes knip` in `archlucid-ui/` (Knip not added to `devDependencies`).  
> **Raw output:** `artifacts/knip-tb860-2026-07-17.txt` (gitignored scratch; regenerate locally).

## Sponsor summary

Knip **did not report any unused production `dependencies`** after **TB-858** and **TB-859** removed the three packages identified in [`ui_dependency_assessment.md`](ui_dependency_assessment.md) §6. The manual assessment stands: **no additional Tier 1 unused direct dependency removals** are warranted from Knip output alone.

Knip exit code **1** reflects devDependency / dead-code / export-noise findings, not open production-dependency removals.

## Comparison to assessment §6

| Assessment §6 package | Knip unused `dependencies`? | Post-TB-858/859 status |
| --- | --- | --- |
| `@microsoft/applicationinsights-react-js` | N/A (removed) | **Done** — TB-858 |
| `ajv` | N/A (removed) | **Done** — TB-859 |
| `ajv-formats` | N/A (removed) | **Done** — TB-859 |
| All other direct `dependencies` | **None flagged** | Confirmed in use (per Knip resolver) |

## Knip categories reviewed (manual cross-check)

### Unused `devDependencies` (2)

| Package | Knip claim | Manual cross-check | Action |
| --- | --- | --- | --- |
| `@eslint/eslintrc` | No static import | Flat config (`eslint.config.mjs`) uses `eslint/config` + `eslint-config-next` only. Package is already pulled **transitively** by `eslint`. Direct `devDependency` is **redundant**, not proof of dead tooling. | **No removal in TB-860.** Optional hygiene later; low priority. |
| `@lhci/cli` | No static import | Used as **CLI** via `scripts/run-lighthouse-ci.mjs` → `npx lhci autorun` (shipped **TB-693**). `lighthouserc.cjs` is config input, not an import surface. | **Keep.** Knip CLI/binary blind spot. |

### Unlisted dependencies (5)

| Module | Knip locations | Manual cross-check | Action |
| --- | --- | --- | --- |
| `dompurify` | `ArchitectureDiagramViewer.tsx`, `architecture-narrative-presentation.ts` | Version pinned in `package.json` **`overrides`** (`^3.4.11`), not `dependencies`. Imports resolve via transitive graph (e.g. `jspdf` / diagram stack). | **Keep override.** Not a missing direct dep. |
| `axe-core` | `e2e/helpers/axe-helper.ts`, `tests/accessibility.spec.ts` | `@axe-core/playwright` and `jest-axe` are direct `devDependencies`; `axe-core` is the shared engine. | **No manifest change.** Documented transitive use. |
| `postcss-load-config` | `postcss.config.mjs` JSDoc `@type` only | No runtime `import`; PostCSS loads config by convention. | **No action.** Type reference only. |

### Unlisted binaries (1)

| Binary | Knip note | Manual cross-check | Action |
| --- | --- | --- | --- |
| `pwsh` | Referenced from `package.json` scripts | Windows agent/CI scripts (`demo`, `build:analyze`, `ux-audit`, etc.) invoke PowerShell explicitly. | **Expected** on Windows; not an npm package entry. |

### Out of scope for dependency work (informational)

Knip also reported large **unused file** (100), **unused export** (740), **unused exported type** (279), and **duplicate export** (33) counts. These reflect dead-code / barrel-export surface area, not dependency manifest errors. **No dependency changes** are inferred from those buckets in this ticket.

## Conclusion

1. **§6 validated:** Knip finds **zero** unused direct production dependencies beyond the three already removed.
2. **No new Tier 1 removal candidates** surfaced with the same evidence bar as §6.
3. **Follow-on backlog** (unchanged): **TB-861** (`engines.node`), **TB-862**/**TB-863** (import-policy tests), **TB-864** (audit CI), **TB-865** (`optimizePackageImports` guard).

## Related

- Source assessment: [`ui_dependency_assessment.md`](ui_dependency_assessment.md) §6, Prompt 3 (**TB-860**)
- Tier 1 removals: **TB-858**, **TB-859** (Done 2026-07-17)
