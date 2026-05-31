# `archlucid-ui` — agent scope

## What this folder is

Next.js (App Router) UI for ArchLucid: marketing, operator shell, and review workflows. It consumes the HTTP API; **business rules and authority logic live in .NET** under the repo root.

## UI visual standard (V1 GA requirement — read before writing any component)

**Canonical doc:** [`docs/library/UI_DESIGN_SYSTEM.md`](../docs/library/UI_DESIGN_SYSTEM.md)

ArchLucid's V1 GA UI must follow **IBM Carbon Design System** as the primary visual reference, with **Microsoft Fluent 2** for shell/navigation polish. Tailwind/shadcn defaults are component primitives only — they are **not** the aesthetic target.

Key rules for every component:
- Neutral gray surfaces; restrained teal accent only for interactive elements and focus rings.
- No decorative pastel card backgrounds.
- Compact enterprise spacing (`space-y-4`, `p-4`) — not marketing-scale spacing.
- Status is communicated via `<StatusTag>` and `<SeverityTag>` with canonical copy.
- Technical details (IDs, CLI commands, model names) are hidden behind disclosure affordances on normal surfaces.
- Product language: *review package*, *finding*, *evidence trail*, *governance approval*, *audit trail* — not *run*, *job*, *alert* (unless it is an alert), *log*.

Wave 1 Carbon primitives (**TB-114 – TB-120**, 2026-05-31): design tokens (`design-tokens.ts`, `--al-*` CSS vars), `StatusTag`, `SeverityTag`, `EnterpriseTable`, operator spacing/typography on home/run detail/dashboard/audit, Cursor rule **`.cursor/rules/UI-Enterprise-Design-Standard.mdc`**. Remaining **TB-115** surface audit (full repo pastel pass) and **TB-117** migrations (governance findings table) are follow-ups in [`docs/library/TECH_BACKLOG.md`](../docs/library/TECH_BACKLOG.md).

## Before large UI refactors

- **API contract of record:** `docs/library/API_CONTRACTS.md` (canonical surface is **`GET /openapi/v1.json`**, not Swagger-only JSON).
- **Generated types:** `npm run generate:api-types` → `src/lib/api-types.generated.ts` (must stay aligned when OpenAPI changes; see root workspace rule **`Http-Surface-Docs-And-Clients.mdc`**).
- **`src/lib/openapi-schemas.ts`** re-exports `components` / `paths`; prefer aliasing schemas there (see `types/authority.ts`) over parallel DTO structs.
- **Deferred UI architecture work:** `docs/library/UI_ARCHITECTURE_V1_1.md` (data-fetching layer, SidebarNav refactor, Suspense polish, …).
- **Product documentation presentation (V1):** `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md` — customer-facing help links must use in-app `/help/{topic}` routes, not GitHub blob pages (**TB-143 – TB-148**).

## Typical commands

From **`archlucid-ui/`**:

| Task | Command |
|------|---------|
| Install deps | `npm ci` |
| Lint / unit tests | See **`package.json`** scripts (Vitest). |
| E2E | Playwright scripts in **`package.json`** (often require API / env — see **`docs/engineering/BUILD.md`**). |

Repo-wide build graph: **`docs/engineering/BUILD.md`**.

## .NET coupling (minimal Solution Filter)

Open **`ArchLucid.UI.slnf`** at the repo root when you only need **Contracts + `ArchLucid.Api.Client`** beside this folder (e.g. verifying generated client parity). Full backend work stays on **`ArchLucid.sln`** or **`ArchLucid.Backend.slnf`**.

## Repo-level agent docs

See **`docs/engineering/AGENTS.md`** (repo-root **`AGENTS.md`** is a pointer) for monorepo layout, assessments read list, and other **`*.slnf`** filters.

**Cursor rules for this folder:** `.cursor/rules/UI-Enterprise-Design-Standard.mdc`, `.cursor/rules/UI-React-Next-Conventions.mdc`, `.cursor/rules/UI-Stable-Selectors-And-Snapshots.mdc`, `.cursor/rules/UI-Accessibility-Baseline.mdc` (auto-applied when editing `archlucid-ui/**/*.ts` / `*.tsx`).

## UI-local deep docs (`archlucid-ui/docs/`)

Implementation detail for this app (operator shell, nav contract, testing). Prefer these over duplicating long prose in code comments:

| Topic | Doc |
|------|-----|
| Operator shell behaviour | [OPERATOR_SHELL_TUTORIAL.md](./docs/OPERATOR_SHELL_TUTORIAL.md) |
| Nav metadata + drift guard | [NAV_CONFIG_CONTRACT.md](./docs/NAV_CONFIG_CONTRACT.md) |
| App architecture | [ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| Data flow / client state | [DATA_FLOW_AND_STATE.md](./docs/DATA_FLOW_AND_STATE.md) |
| Component map | [COMPONENT_REFERENCE.md](./docs/COMPONENT_REFERENCE.md) |
| C# ↔ React mapping | [CSHARP_TO_REACT_ROSETTA.md](./docs/CSHARP_TO_REACT_ROSETTA.md) |
| Testing & troubleshooting | [TESTING_AND_TROUBLESHOOTING.md](./docs/TESTING_AND_TROUBLESHOOTING.md) |
| Demo flags & unit tests | [DEMO_FLAGS_AND_UNIT_TESTS.md](./docs/DEMO_FLAGS_AND_UNIT_TESTS.md) |
| Demo runs fallback | [OPERATOR_DEMO_RUNS_FALLBACK.md](./docs/OPERATOR_DEMO_RUNS_FALLBACK.md) |
| Trial signup UI | [TRIAL_SIGNUP_UI.md](./docs/TRIAL_SIGNUP_UI.md) |
| Keyboard shortcuts | [KEYBOARD_SHORTCUTS.md](./docs/KEYBOARD_SHORTCUTS.md) |
| Annotated walkthrough | [ANNOTATED_PAGE_WALKTHROUGH.md](./docs/ANNOTATED_PAGE_WALKTHROUGH.md) |

**Canonical buyer narrative** (repo root, not UI-only): [`../docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](../docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md).
