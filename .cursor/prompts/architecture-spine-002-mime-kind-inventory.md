# AS-002 — Inventory intake MIME vs authority MIME vs stored-file kinds

**Wave:** architecture-spine (**AS**). **Cluster:** diagram-inventory. **Depends on:** AS-001.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Publish a shrink-only inventory of file kinds the wizard accepts, kinds `buildIntakeContextDocumentsFromEvidenceFiles` sends, kinds context ingestion accepts, and kinds ESI catalogs as stored-file vs citation. Each row: extension/MIME, today (drop / extract-text / store-only / analyze), owner prompt.

## Why

Without a listed map, later prompts will “fix” PNG in the wizard and leave the authority allowlist dropping it.

## Context

- `intake-context-documents-from-files.ts`
- `evidence-readable-text.ts` (`READABLE_EVIDENCE_TEXT_EXTENSIONS`, `BINARY_ARCHITECTURE_DOCUMENT_EXTENSIONS`)
- CONTEXT_INGESTION docs / `ContextDocumentRequest`
- ESI catalog kinds (`stored-file` vs `citation`)
- Pattern: `finding-pointer-cas-inventory.ts`

## What to build

1. Write `archlucid-ui/src/lib/architecture-spine/architecture-input-kind-inventory.ts` (or equivalent path under `src/lib/`).
2. Rows must include at least: md, txt, json, yaml, pdf, docx, png, jpeg, svg, vsdx, drawio, mermaid, tf/bicep (already separate ingest).
3. Mark png/jpeg as `droppedFromAuthority` today, `asOwned`.
4. Vitest: every `sourceRoot` exists; png/jpeg are not `analyze`.

## Acceptance criteria

- Inventory is the SoT later ratchets (AS-038) grep.
- No production behavior change.

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

