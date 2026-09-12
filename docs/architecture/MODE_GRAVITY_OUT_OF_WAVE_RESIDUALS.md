> **Scope:** Contributor-reference — mode-gravity (MG) explicit out-of-wave skips for MG-024 close audit. Not buyer-facing copy.

# Mode-gravity out-of-wave residuals

**Status:** recorded in [`MODE_GRAVITY_ACCEPTANCE_2026-09-11.md`](MODE_GRAVITY_ACCEPTANCE_2026-09-11.md) (MG-024) · **Do not** mark these rows shipped unless product actually ships them.

| Item | Tracking | Owner prompt | Status | Notes |
|------|----------|--------------|--------|-------|
| Delete Guided workspace mode | Out of product | **MG-013** | **Not shipped** | Guided stays eval teaching product (ADR 0080). Deleting Guided recreates teaching on Working. |
| Flip host `AgentExecution:Mode` default to Real | GTM **G-REAL-06** | **MG-014** | **Not shipped** | AS-085 ratchet; appsettings stay Simulator. Career vs Rehearsal is chrome + stamp. |
| Collapse eight flags into one env var | Product backlog | — | **Deferred** | MG wave documents and ratchets; flag removal is a later owner program. |

## Do not claim

- Guided was deleted or merged into Working in mode-gravity wave 27.
- G-REAL-06 executed or host `AgentExecution:Mode` default moved to Real.
- `NEXT_PUBLIC_OPERATOR_EXPERIENCE` was removed from local `.env.development`.

## Ratchet

- `archlucid-ui/src/lib/mode-gravity-out-of-wave-residuals.ts`
- `archlucid-ui/src/lib/mode-gravity-out-of-wave-residuals.test.ts`
