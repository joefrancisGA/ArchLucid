> **Scope:** ADR 0071 — Working-document undo vs sealed amend (livelihood-kernel LK-01).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0071: Working-document undo vs sealed amend

- **Status:** Accepted
- **Date:** 2026-09-05
- **Implemented:** 2026-09-05 (LK-01 / LK-02)

## Context

ArchLucid is a working-architect tool: people sit in it much of the day and livelihoods may depend on the sealed record (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13). Waves 8–11 shipped overlays and named but forbade changing two reversibility bets:

1. **`MUTATION_UNDO_WINDOW_SECONDS = 300`** — silent Undo toast for governed writes (finding disposition, approve/reject/promote).
2. **No document undo stack** on the unsealed architecture draft editor — autosave persists forward-only; mistakes after five minutes require Record correction.

Five-minute Undo is correct for **governed mutations** (audit-shaped, append-only history). It is wrong for **document editing** on unsealed work: Excel and VS Code undo keystrokes without converting every edit into an audit event. The sealed record stays the opposite — ADR 0039 immutability after finalize.

ADR 0068 keeps draft (`DraftRequests`) and review (`Runs`) as separate kernels and tables. This ADR applies only to the **draft document** primitive before spawn lock.

**Related:** ADR 0039 (sealed immutability), ADR 0050 (trail — unrelated to document undo), IS-12 (reverse-with-audit on governed writes), WA-10 (clone-from-snapshot after spawn).

## Decision

1. **Unsealed draft editor (Working and Guided):** maintain a bounded **document undo/redo stack** of draft field snapshots (`ArchitectureDraftFieldState` + `ActorSet`), depth **N = 50**, coalesced on ~500ms idle after user edits (not every keystroke).
2. **Storage:** in-session memory only; restored snapshots persist through existing autosave. Do **not** store undo history in `localStorage` as source of truth for server-backed drafts.
3. **Spawn-locked / handed-off drafts:** discard the stack; clone-from-snapshot (WA-10) is the legal new version. No undo into locked fields (LK-04 handoff).
4. **Governed writes:** unchanged — `MUTATION_UNDO_WINDOW_SECONDS = 300` silent Undo, then IS-12 reverse-with-audit for the revisit window. This ADR does **not** lengthen the toast.
5. **Finalize / seal:** `permanent`. Cannot unseal. Record correction remains append-only rationale (FD-11 / IS-12).

## Trade-offs

**Gains:** Architects can recover draft typos hours later without Record correction; document editing matches professional-editor expectations; governed-write audit trail stays short and intentional.

**Sacrifices:** Memory holds up to 50 snapshots per open draft tab; undo does not cross tabs or devices (autosave conflict recovery is LK-12); spawn lock clears history (expected — handoff is a lifecycle boundary); server never stores undo stack (refresh loses pre-autosave undo steps until next edit coalesce).

**Rejected:** Lengthening `MUTATION_UNDO_WINDOW_SECONDS` to cover document edits (conflates two primitives; audit noise); server-side undo aggregate (complexity, ADR 0068 table boundary); undo after seal (violates ADR 0039).

## Constraints

- Do not merge `DraftRequests` and `Runs` SQL tables.
- Do not rewrite ADR 0039 or ADR 0050 bodies.
- Do not change `MUTATION_UNDO_WINDOW_SECONDS` for the silent Undo toast.
- WCAG 2.1.4: document undo uses **Ctrl+Z** / **Ctrl+Shift+Z** (modifier required), not bare printable keys.
- Spawn lock rule (`architecture-draft-handoff-gate.ts`) unchanged.

## Expected impact

**System:** `useArchitectureDraftDocumentUndo` + palette/keyboard wiring on architecture draft workspace. No API schema change. Autosave PATCH shape unchanged.

**Security:** Undo snapshots live in tab memory; no new XSS surface beyond existing draft fields. BFF session (ADR 0059) is orthogonal.

**Operations:** Vitest on undo/redo and spawn-locked disable. No infrastructure cost.

**Teams:** Reviewers can refuse “just lengthen the toast” by citing 0071. IS-12 remains the owner for governed reverse-with-audit.

## Consequences

- **Positive:** Livelihood-grade document editing on unsealed work; clear separation from seal immutability.
- **Negative:** Undo lost on full page refresh before coalesced snapshot; second tab does not share stack (LK-12 addresses save conflicts).
- **Follow-ups:** LK-12 optimistic concurrency on autosave; LK-04 handoff layout when spawn-locked.
