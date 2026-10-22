# LP-14 — Apply-change preview is server-attested

Do not lengthen 300s undo. Do not treat mute as disposition.

## Goal

`finding-apply-change-preview-gate.ts` sessionStorage override must **not** be sufficient to mark **Remediated** on Working. Preview completion (or explicit override) is a **server-attested** flag on the disposition request (header or body field already in the API if present; otherwise add one field — not a new product).

Guided/demo may keep the client gate with loud “not career-complete” labeling.

## Why

Livelihood writes that skip impact preview via a tab-local flag are not defensible. The architect’s “I applied this” must survive reload and a second browser.

## Context

- `archlucid-ui/src/lib/findings/finding-apply-change-preview-gate.ts` (adjust path if moved)
- `FindingDispositionService`, ADR 0076 row version
- Terraform advisory safety — do not add `destroy`

## What to build

1. API: accept `impactPreviewCompleted` / `previewOverrideReason` (names per existing vocabulary).
2. Working: reject Remediated without one of those attested fields.
3. Stop treating sessionStorage as the source of truth; it may be UX cache only.
4. C# + Vitest: sessionStorage-only cannot succeed Working Remediated.

## Acceptance criteria

- Two tabs cannot disagree: server is the gate.
- Record correction remains the path after a mistaken Remediated.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067–0081 bodies except Related pointers. This wave **adds ADR 0082** and **ADR 0083**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.
