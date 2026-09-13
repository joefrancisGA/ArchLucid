> **Scope:** Contributor-reference — livelihood-day (LY) explicit out-of-wave skips for LY-120 close audit. Not buyer-facing copy.

# Livelihood-day out-of-wave residuals

**Status:** recorded in [`LIVELIHOOD_DAY_ACCEPTANCE_2026-09-13.md`](LIVELIHOOD_DAY_ACCEPTANCE_2026-09-13.md) (LY-120) · **Do not** mark these rows shipped unless product actually ships them.

| Item | Tracking | Owner prompt | Status | Notes |
|------|----------|--------------|--------|-------|
| G-REAL-06 / host `AgentExecution:Mode` flip | LN-026 / GTM | **LY-116** | **Not shipped** | Host Mode stays Simulator. Real finalize judge does not flip Mode. |
| Draft-to-draft Compare | R12 / SN-038 / CE-017 | **LY-046** / **LY-117** | **Not shipped** | Compare stays committed-manifest. Do not implement draft-diff. |
| Presence avatars / cursors / occupancy | ADR 0090 / SN-039 / CE-018 | **LY-058** / **LY-118** | **Not shipped** | Work-lease is the collab primitive. |
| Finding-comment chat | ADR 0076 | **LY-059** / **LY-118** | **Not shipped** | Disposition remains the collab primitive. |
| Lengthen 300s undo toast | ADR 0071 | **LY-043** | **Not shipped** | `MUTATION_UNDO_WINDOW_SECONDS = 300` stays. |
| Per-snapshot Unchecked-row judge cap | LY-016 leftover | **LY-016** | **Deferred** | Completions reuse `IAgentTierCompletionRouter`. No separate judge wallet. |
| Tenant `finding-engine-controls` key for finalize judge | LY-013 | **LY-013** | **Not shipped** | Host JSON `EnableLlmJudgeOnFinalize=false` is the opt-out. |

## Do not claim

- G-REAL-06 live packets or host Mode flip shipped in livelihood-day wave 33.
- Draft-diff Compare, live presence, or finding-comment chat shipped in this wave.
- A tenant Finding engines toggle for `EnableLlmJudgeOnFinalize`.
- CPA/SOC attestation or legally verified semantic support.

## Ratchet

- `archlucid-ui/src/lib/livelihood-day-out-of-wave-residuals.ts`
- `archlucid-ui/src/lib/livelihood-day-out-of-wave-residuals.test.ts`
- `archlucid-ui/src/lib/mutation-reversibility-registry.test.ts` (`MUTATION_UNDO_WINDOW_SECONDS = 300`)
