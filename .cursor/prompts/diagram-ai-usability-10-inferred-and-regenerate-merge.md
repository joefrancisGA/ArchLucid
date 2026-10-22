# DAU-10 — Inferred explanations and regenerate merge

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** DAU-09 (patch/version source). **Do not** implement DAU-11–DAU-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

1. Each inferred node/edge shows **why it was inferred** (source section/span), not only Accept/Remove.
2. Regenerating the diagram while a `user-edit` version is active produces a **three-way merge preview** (base generated / user / new generated) instead of silently pausing inferred review or wiping edits.

## Why

`ArchitectureDiagramInferredPanel` is a label list. Copy already says inferred review is paused during hand-edited Mermaid. Round-trip was called out in `docs/architecture/generation_quality_analysis.md`: architects abandon systems that regenerate away edits.

## Context

- `archlucid-ui/src/components/architecture/ArchitectureDiagramInferredPanel.tsx`
- `archlucid-ui/src/lib/architecture/architecture-diagram-copy.ts` (`ARCHITECTURE_DIAGRAM_INFERRED_LOCKED_FOR_HAND_EDIT`)
- `archlucid-ui/src/lib/architecture/architecture-diagram-generate.ts`
- `archlucid-ui/src/lib/architecture/architecture-diagram-storage.ts`
- `archlucid-ui/src/lib/architecture/architecture-diagram-types.ts` (`ArchitectureDiagramVersionSource`)
- `archlucid-ui/src/components/architecture/use-architecture-diagram-panel.ts`
- Provenance helpers: `architecture-diagram-provenance.ts`

## What to build

1. Extend inferred rows with `reason` from structured parse (section key / entity label). If the generate path has no span today, pass `section.key` from `parseArchitectureGeneratedContent` into the model as optional `inferenceNote` on nodes (additive field). Display in the inferred panel under the label.
2. Batch actions: **Accept all inferred edges that match brief entities** / **Remove inferred trust boundaries** only if you can implement with existing kinds — otherwise skip batch and do per-row reason only.
3. `mergeArchitectureDiagramVersions({ base, user, incoming })`:
   - Key by node/edge id then by normalized label.
   - User-only ids kept.
   - Incoming-only ids added as `inferred` pending.
   - Conflicts (same id, different label): keep user, list in a conflict list for explicit take-incoming.
   - Do not auto-delete user nodes.
4. UI on regenerate when `activeVersion.source === "user-edit"`: dialog listing keep/add/conflict. Primary **Apply merge** disabled until the operator confirms (TB-2005). Secondary **Discard my edits and use generated**.
5. Vitest: reason rendered; merge keeps user-only node; conflict does not silently take incoming; locked copy still used if merge UI is dismissed.

## Acceptance criteria

- Inferred Key Vault shows which brief section it came from (or an honest “no source span” helper — never a fake quote).
- Regenerating a hand-edited diagram cannot drop a user node without the discard path.
- Mermaid remains a view of the merged model.

## Constraints

- Working-tree safety script before tracked edits.
- **Do not** implement vision UI (DAU-11).
- **Do not** store merge results only in `localStorage` if a server model exists for the run — follow whatever persistence the panel already uses; do not claim audit-trail versions (copy already says device-local history is not the audit trail).
- Verification: focused Vitest on inferred panel, generate, merge helper, panel hook.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
