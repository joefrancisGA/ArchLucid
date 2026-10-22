> **Scope:** Contributor note — PATCH CAS (ADR 0088) vs start-review stale UpdatedUtc (Hasher wave 23 item 226). Not a buyer doc.

# Lost-write: start-review vs draft PATCH CAS (LW-022)

These are **two guards**. Do not merge them. Do not weaken either.

| Guard | When | Omit token | Stale token |
|-------|------|------------|-------------|
| `DraftPatchStaleUpdatedUtcGuard` (ADR **0088**, livelihood UX wave 23) | `PATCH` while `Drafting` | **409** `draft_cas_token_missing` | **409** `draft_cas_stale` |
| `DraftStartReviewStaleUpdatedUtcGuard` (Hasher robustness wave 23 **item 226**) | Start review / admit-submit | Still allowed (unreadiness + optional token) | Conflict — refresh and retry start review |

Hasher wave 23 is **not** this livelihood UX wave. Do not renumber items 221–230. Start-review admission behavior stays as shipped.

**Related:** `docs/architecture/adrs/0088-draft-patch-cas-mandatory.md`, `docs/library/ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE23.md` item 226.
