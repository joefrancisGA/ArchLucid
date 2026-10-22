# PC-08 — Execute in background; workbench stays the desk (LK-10 completion)

**Do not fork LK-10** — execute/complete it. **Do not fork FD-12 / CD-13** wait copy if already shipped — verify. **Do not fork CR-06** Home hero theater.

## Goal

When a review pipeline is in-flight for the open `runId`:

1. **Findings workbench** (dual-pane + keyboard triage) stays mounted on review-detail — not replaced by a full-page spinner.
2. Copy: “Review running in background” + link to shell in-flight strip; **remove** “stay on this tab” / wait-as-primary-job language.
3. User can navigate to another architecture/review; completion toast + in-flight registry still fire (TB-2077).
4. Partial findings band (if API streams) remains triageable when policy allows.

## Why

Pipeline-as-job is an evaluator pattern. All-day architects triage while compute runs — like tests in IDE, not like a download page.

## Context

- `livelihood-kernel-10-wait-is-not-the-desk.md`
- `ReviewDetailWorkspace.tsx`, `use-review-pipeline-in-flight-for-run.ts`
- `in-flight-operations-store`, `use-shell-in-flight-operations.ts`
- `ArchitectureFindingsDualPane.tsx`, `FindingKeyboardTriageHost`

## What to build

Implement LK-10 acceptance criteria. Add Vitest: in-progress fixture keeps workbench `data-testid` mounted; keyboard Alt+J works on visible band.

## Acceptance criteria

- Working user dispositions findings while execute polls in background (mocked test sufficient).
- Guided may keep stronger wait teaching.

## Constraints

- Do not cancel in-flight without confirm (AD-02).
