# AS-013 — OpenAPI: context documents may carry structured diagrams

**Wave:** architecture-spine (**AS**). **Cluster:** diagram-wire. **Depends on:** AS-006, AS-003.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Update OpenAPI + generated TS if `ContextDocumentRequest.contentType` or equivalent is a closed list. Add the structured diagram content type and/or a sibling `diagram` field. Snapshot tests.

## Why

UI and API will drift if only the wizard changes.

## Context

- `docs/library/OPENAPI_CONTRACT_DRIFT.md`
- `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`

## What to build

1. Regenerate types per API_CONTRACTS.md.
2. Buyer snapshot if that pipeline exists.
3. Do not regenerate unrelated schemas.

## Acceptance criteria

- CI snapshot green.
- Generated TS includes the new content type or field.

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

