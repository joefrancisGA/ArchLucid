# AS-014 — Expert/Socratic wizard binds image files to the ESI catalog

**Wave:** architecture-spine (**AS**). **Cluster:** diagram-intake. **Depends on:** AS-004, ESI catalog (shipped).

Do not implement from the wave index. Implement only *What to build*.

## Goal

First-pilot and Socratic wizards upload PNG/JPEG/SVG/vsdx onto the same stored-evidence catalog ESI uses, then attach catalog ids on the create payload. Do not keep sessionStorage as SoT (ESI-05).

## Why

AS-004 stubs are useless if create never persists the original.

## Context

- ESI-01/06 catalog + intake original retention
- FirstPilotIntakeWizard / SocraticIntakeWizard

## What to build

1. Reuse ESI upload path; do not invent a second blob container.
2. Vitest: attaching a PNG results in a stored-file catalog row after create (mock API).
3. Do not send PDF bytes into text/plain ingestion (ESI-06).

## Acceptance criteria

- Create → Evidence tab can open the PNG (already ESI) **and** the review knows the id for extract.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** re-run ESI, IE-01–IE-22, LP, FP, WS, SY, AO, DX-01–DX-68 bodies except as a named leftover. Implement only *What to build*. Consume IE types; do not fork a second Azure collector.
- **Do not** add a 40th coverage engine or a “node type missing from diagram” engine. **Do not** invent live presence avatars or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06. Career vs Rehearsal is product chrome (AS-076+), not a host-config flip.
- **Do not** make vision/OCR extract default-on. Working opt-in only (AS-040).
- Architecture-scoped sharing (AS-086+) is **inside** the tenant. **Do not** replace ADR 0037 catalog isolation. **Do not** add SQL RLS.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).

