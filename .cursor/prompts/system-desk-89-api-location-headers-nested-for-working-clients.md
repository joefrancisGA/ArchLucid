# SY-89 — API Location / uiHref fields prefer nested architecture URLs when ArchitectureId is set

Do not change resource ids. Optional `uiHref` / `Location` only if already part of the contract — do not add a breaking field without OpenAPI snapshot update.

## Goal

If create-review responses already include a UI URL, Working clients should receive nested hrefs. If not, add a documented optional `uiHref` **only** if OpenAPI already has a similar field; otherwise skip and keep CLI/UI builders as source of truth.

## Why

Clients that trust Location will bookmark whatever the API says.

## Context

- OpenAPI + create review response DTOs

## What to build

1. Inspect contract. If a UI URL exists, nest it. If not, do **not** expand the API in this prompt — record skip in the PR.
2. OpenAPI snapshot + client regen if you do change the contract (`docs/library/OPENAPI_CONTRACT_DRIFT.md`).

## Acceptance criteria

- No silent contract change. Nested href if the field already exists.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip. A desk **command bar** or nested tool route is not a More menu for those tabs.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0068, 0069, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0079** (desk is the work surface) and **Accepts ADR 0077** when the locator already shipped.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run AO-01–50, CA-01–50, DA-01–12, PC-01–13, DR-01–16, FC-01–80, or LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact**. SQL stays in the single DDL file per database plus a numbered migration if schema changes (this wave should not need new tables).

