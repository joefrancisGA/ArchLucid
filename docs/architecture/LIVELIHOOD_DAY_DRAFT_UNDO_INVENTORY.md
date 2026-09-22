> **Scope:** Contributor-reference — Working draft undo surfaces (LY-041). Not buyer-facing copy.

# Livelihood-day draft undo inventory (LY-041)

ADR **0071** in-tab draft document undo. ADR **0039** sealed records stay immutable. `MUTATION_UNDO_WINDOW_SECONDS = 300` stays (LY-043).

Cross-refresh restore after reload is **not** this inventory — see **LY-042** residual. Do **not** use `sessionStorage` as undo source of truth.

## In-tab (shipped)

| Surface | Notes |
|---------|-------|
| Working draft document undo stacks | `architecture-draft-document-undo.ts` — depth 50, coalesce ~500ms. Memory in the open tab. Lost on refresh. Disabled when spawn-locked. |
| Keyboard undo/redo on the draft desk | `use-architecture-draft-document-undo.ts` — same stacks. |

## Governed toast (not draft editor)

| Surface | Notes |
|---------|-------|
| Finding disposition Undo | Visible 300s toast. Classification `reversible`. Not authority to unseal. |

## Forbidden

| Surface | Notes |
|---------|-------|
| Sealed review record | Finalize is `permanent`. Snapshot cannot be unsealed. Record correction is append-only. |
| General server undo log for sealed records | **LY-044** residual — do not add. |

## Ratchet

- `archlucid-ui/src/lib/livelihood-day-draft-undo-inventory.ts`
- `archlucid-ui/src/lib/architecture/architecture-draft-document-undo.test.ts`
- `archlucid-ui/src/lib/mutation-reversibility-registry.test.ts`
