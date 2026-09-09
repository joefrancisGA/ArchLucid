# AS-001 — ADR 0084: diagrams and bound inventory are first-class review inputs

**Wave:** architecture-spine (**AS**). **Cluster:** kernel-adr. **Depends on:** none — run first.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Author `docs/architecture/adrs/0084-architecture-review-inputs-include-diagrams-and-bound-inventory.md` (Status: Proposed). Decision: the review authority pipeline’s inputs are (1) asserted text/context, (2) **structured diagrams** (parsed nodes/edges, not pixels-as-prose), (3) **bound inventory snapshots** when the architecture has one. Inspect/preview of originals (ESI) stays a separate surface. Pixel-only files without structured extract are **NotVerifiable** sources, not silent drops. Do not implement parsers in this prompt.

## Why

Working architects defend topologies they drew and estates they operate. Today PNG/JPEG return null from intake context builders and the authority MIME allowlist is text/plain + text/markdown. ESI can open the file; engines never see it. That is a livelihood ontology hole, not a chrome hole.

## Context

- ADR template: `docs/architecture/adrs/template.md`
- Next free number after **0083** is **0084**
- `archlucid-ui/src/lib/intake-context-documents-from-files.ts`
- `docs/library/INFRA_EVIDENCE_PLANE.md` (consume, do not rewrite)
- `docs/library/customer-facing/EVIDENCE_INTAKE_OPERATOR_GUIDE.md`

## What to build

1. Write ADR 0084 with Context, numbered Decision, Trade-offs, Constraints, Expected impact (include security), Consequences.
2. Add a row to `docs/architecture/adrs/README.md`. Proposed in this PR is OK.
3. Guard test: ADR file exists; status Proposed or Accepted; does not claim vision default-on; does not merge DraftRequests/Runs.
4. Do **not** implement ingest parsers, inventory collector, or MIME allowlist expansion in this prompt (AS-003+).

## Acceptance criteria

- PR review can quote 0084 for “may this diagram/inventory participate in decide?”
- Trade-offs name parse-noise vs silent drop of the architect’s primary artifact.
- Constraints forbid host Simulator→Real flip, second Azure collector, and coverage engines.

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

