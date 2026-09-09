# AS-003 — Context ingestion MIME contract for structured diagrams

**Wave:** architecture-spine (**AS**). **Cluster:** diagram-contract. **Depends on:** AS-002.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Document and type the allowlist expansion: authority context may accept structured diagram documents (`application/vnd.archlucid.diagram+json` or equivalent existing DiagramAst JSON) **in addition to** text/plain and text/markdown. Pixels are not valid context bytes. Do not parse vsdx in this prompt.

## Why

ESI kept the authority MIME allowlist on purpose. This wave **reopens that allowlist** for structured diagram JSON only — not for PNG bytes in text/plain.

## Context

- CONTEXT_INGESTION.md / Context ingestion project
- ADR 0084 (AS-001)
- IE-18 ArchitectureDiagramModel — reuse, do not fork a second model family

## What to build

1. Add `docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md`: allowed content types, forbidden pixel-as-text, ExtractionMethod enum (StructuredParse | VisionOptIn | None).
2. Align C# request DTO comments + TS types if a contentType union exists; OpenAPI only if the wire enum is closed today.
3. Honesty CI sentence: “attached PNG is analyzed” is false unless structured extract or opt-in vision succeeded.
4. Tests: contract file exists; forbids image/* as context contentType.

## Acceptance criteria

- Reviewers can refuse a PR that posts PNG bytes into context ingestion.
- IE-18 model is referenced, not copied.

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

