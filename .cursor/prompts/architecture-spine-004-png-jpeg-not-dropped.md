# AS-004 — Wizard must not return null for PNG/JPEG

**Wave:** architecture-spine (**AS**). **Cluster:** diagram-intake. **Depends on:** AS-003.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Change `buildIntakeContextDocumentsFromEvidenceFiles` / `toIntakeContextDocument` so PNG/JPEG (and other inventory `droppedFromAuthority` image kinds) no longer vanish. They must produce a stub the pipeline understands: stored-file id + `ExtractionMethod=None` + NotVerifiable diagram source — or wait for structured extract. Do not OCR.

## Why

Silent `return null` is how the architect’s drawing disappears from decide while ESI still shows the filename.

## Context

- `intake-context-documents-from-files.ts`
- ESI catalog + `evidenceItemId`
- AS-002 inventory

## What to build

1. Stop returning null for png/jpeg when the file is non-empty.
2. Wire stored-file identity if ESI catalog id is already available in the wizard; otherwise a client-side pending marker that AS-014/015 bind.
3. Vitest: PNG File yields a payload or explicit pending document; not an empty list.
4. Do not send image bytes as text/plain content.

## Acceptance criteria

- A wizard with only a PNG no longer creates a review with zero context documents and no honesty.
- No vision calls.

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

