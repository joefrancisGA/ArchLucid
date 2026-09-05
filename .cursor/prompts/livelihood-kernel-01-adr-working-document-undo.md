# LK-01 — ADR 0071: Working-document undo vs sealed amend

**Do not rewrite ADR 0039.** Sealed records stay immutable. **Do not rewrite ADR 0050.** **Do not fork IS-12** for reverse-with-audit on governance dispositions — that file keeps the 300s Undo toast and 24h reverse-with-audit. This file **changes the bet** previous waves forbade: unsealed working documents get an **instrument undo stack**, not only a five-minute toast.

## Goal

Write **ADR 0071** (next free number after 0070): ArchLucid has two reversibility kernels.

1. **Working document (unsealed draft editor):** last-N undo/redo of document state, like a professional editor. Survives the 300s toast. Does not apply after spawn lock.
2. **Governed writes (disposition / approve / reject / promote):** keep `MUTATION_UNDO_WINDOW_SECONDS = 300` silent Undo, then IS-12 reverse-with-audit for the revisit window. History is never silent-deleted.
3. **Finalize / seal:** `permanent`. Cannot unseal. Record correction is append-only rationale (FD-11 / IS-12).

Status **Proposed** is enough if LK-02 lands Accepted in the same PR.

## Why

A working architect who mistypes a constraint at 11:00 cannot be told at 11:06 that the only path is Record correction. Five-minute Undo is a casual SPA. Excel and VS Code undo the document; they do not convert every keystroke into an audit event. The sealed record is the opposite: livelihoods depend on an immutable stamp, so seal stays permanent.

Previous waves globally forbade “lengthening 300s.” That constraint stays for the *toast*. This ADR adds a **different primitive** for unsealed work.

## Context

- `docs/architecture/adrs/template.md` — Trade-offs, Constraints, Expected impact are merge-blocking
- `docs/architecture/adrs/README.md` numbering (next is **0071**)
- `docs/architecture/adrs/0039-commit-sealed-evidence-immutability.md`
- `archlucid-ui/src/lib/mutation-reversibility-registry.ts` — keep 300
- `use-architecture-draft-autosave.ts` — persist is not undo
- ADR 0068 — draft kernel is the document this undo applies to
- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R13

## What to build

1. New file `docs/architecture/adrs/0071-working-document-undo-vs-sealed-amend.md` with required sections.
2. Decision points (falsifiable):
   - Unsealed draft: undo/redo stack of document snapshots (bound N, named in the ADR — prefer 50 or the existing autosave cadence, not unbounded memory).
   - Spawn-locked / handed-off drafts: stack discarded; clone-from-snapshot is the legal new version (WA-10).
   - Finding disposition and governance mutations: no document stack; IS-12 path unchanged.
   - Finalize unchanged-permanent.
3. Row in `docs/architecture/adrs/README.md`.
4. Do **not** implement the stack in this prompt unless the ADR cannot be reviewed without a failing test. Prefer ADR + README. Product is LK-02.

## Acceptance criteria

- ADR 0039 and the mutation registry 300s constant are not rewritten.
- A reviewer can quote 0071 to refuse “just lengthen the toast to four hours” and to refuse undo-after-seal.
- Guided may keep a shorter stack or teaching copy; Working must have the document primitive.

## Constraints

- Do not merge draft and review tables.
- Do not collapse desktop review tabs.
- Do not implement **M-44**.
- Do not store undo snapshots in `localStorage` as the source of truth if the draft is server-backed — server or in-session memory with persist-on-autosave is in scope; pick one in Trade-offs.
