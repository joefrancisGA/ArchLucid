# WS-01 — ADR 0080 — Working seat is never buyer-polished

Do not rewrite ADR 0067. Guided keeps two-door teaching. Do not delete `/al-ui-rate`.

## Goal

Write **ADR 0080**: on **Working**, buyer-polished / eval chrome is forbidden. Dense architect chrome is the default product, not an overlay. Guided / demo / frictionless trial / static showcase **keep** buyer polish. `/al-ui-rate` and similar screenshot pipelines must rate Working as an all-day instrument, not a buyer walkthrough.

## Why

Owner decision 2026-09-07: stop buyer polish on the Working seat. PC-04 / PT-01 / WA-01 shipped a resolver and an env default, then dozens of `/al-ui-rate` merges and grandfathered `isBuyerPolishedOperatorShellEnv()` call sites put the walkthrough skin back on the paying desk.

## Context

- `docs/architecture/adrs/template.md`
- `docs/architecture/adrs/0067-create-architecture-and-review-co-equal-entry-points.md` (Guided only)
- `docs/architecture/adrs/0069-working-desk-one-work-object.md`
- `archlucid-ui/src/lib/production-desk-chrome.ts`
- `archlucid-ui/src/lib/demo-ui-env.ts`
- `.cursor/commands/al-ui-rate.md`

## What to build

1. `docs/architecture/adrs/0080-working-seat-never-buyer-polished.md` with Trade-offs, Constraints, Expected impact (security: eval chrome must not hide shortcut chips or identifiers that Working already discloses behind existing disclosures).
2. Row in `docs/architecture/adrs/README.md`. Fix the stale Proposed listings for **0069**, **0070**, and **0059** to match the Accepted files (hygiene only — do not rewrite those ADR bodies).
3. Explicit reject: “buyer-polished is the production default.” Explicit keep: Guided/demo/trial eval skin.
4. Do **not** implement the resolver sweep in this PR unless bundled with types only — that is WS-05.

## Acceptance criteria

- A reviewer can quote 0080 to refuse a Working `/al-ui-rate` buyer-walkthrough fix.
- 0067 file body stays Guided teaching.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067, 0068, 0069, 0070, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0080** and **Accepts 0078 / 0079**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run SY-01–100, AO-01–50, CA-01–50, FC-01–80, PC-01–13, DR-01–16, DX, or PT overlay waves except as a named leftover. Implement only *What to build*.
- **Do not** ship `/al-ui-rate` buyer-walkthrough remediations onto Working production modules (WS-07). Guided / demo / trial remain eval seats.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.

