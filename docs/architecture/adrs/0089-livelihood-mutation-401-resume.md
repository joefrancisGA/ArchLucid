> **Scope:** ADR 0089 — Livelihood mutating writes resume after 401 from `localStorage`.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0089: Livelihood mutations resume after 401 from localStorage

- **Status:** Proposed
- **Date:** 2026-09-10
- **Owner decision:** Working livelihood **writes** persist a pending mutation on 401, survive tab close, and replay once after sign-in with the same idempotency key (lost-write LW-007). LP-19 two kinds remain; this wave generalizes. FP-24 forbade expanding LP-19 — this ADR is the authorized follow-on.

## Context

LP-19 stored two pending kinds in `sessionStorage`: `finding_disposition` and `governance_mutation_correction`. Closing the origin tab before re-auth dropped the POST. Sibling tabs could not see the pending write. Bulk disposition, draft PATCH, finalize, policy packs, ITSM, shares, and approvals had no replay.

Idle + token-expiry warnings already exist. The remaining failure is mid-session 401 on a livelihood mutate while the architect still has typed work on screen.

**Related:** ADR 0059 (SPA BFF HttpOnly session), ADR 0076 (disposition pointer CAS — replay must keep row versions), ADR 0088 (draft PATCH CAS — resume must replay the stored token, not omit it).

## Decision

1. **Scope:** Inventoried livelihood **mutating** verbs (POST/PATCH/PUT that change a career artifact). Not GET. Not auth bootstrap, billing, or anonymous marketing.
2. **Storage:** Pending mutation lives in **`localStorage`** (v2) so tab close does not drop it. Cross-tab visibility is required; sessionStorage is insufficient.
3. **Replay:** After sign-in, replay **once** on a safe `returnPath` match (keep the LP-19 rule) with the **same idempotency key**. Do not invent a second POST.
4. **Honesty:** Chrome may say the request left the client (`requestLeftClient`) without claiming the server committed.
5. **Not in scope:** Replaying every `apiPost` including billing; wrapping GET; flipping Simulator→Real; live presence.

LP-19 kinds stay working while new kinds (`architecture_draft_patch`, bulk disposition, finalize, …) are added from the inventory (LW-003 / LW-051–062).

## Trade-offs

**Gains:** An architect who hits idle-expiry mid-save does not lose a disposition, draft PATCH, or other inventoried write because they closed the tab to re-auth. Sibling tabs can see a pending mutation. Idempotency prevents double-apply when the original POST actually landed.

**Sacrifices:** `localStorage` is origin-wide XSS-readable (same as other WIP keys). Replay after steal of the BFF cookie is a residual; HttpOnly session (ADR 0059) remains the session store. Operators may see a one-shot replay toast. Engineering must keep a ratchet so new mutate sites join the wrapper or the inventory.

**Rejected:** Resuming GET (amplifies crawlers and cache). Resuming auth token exchange. Claiming every `apiPost` including billing.

## Constraints

- **Do not** replay GET, OPTIONS, or auth bootstrap / refresh routes.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** invent live presence or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default (G-REAL-06).
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- Replay of draft PATCH must still satisfy ADR 0088 (token or forceOverwrite). Replay of disposition must still send pointer CAS row versions (ADR 0076).
- XSS residual on `localStorage` is accepted for WIP durability; do not put secrets or refresh tokens in the pending payload.

## Expected impact

**System:** Storage key migrates from `archlucid.session.livelihoodPendingMutation_v1` (sessionStorage) to a localStorage v2 key (LW-051). A generic mutating-401 wrapper covers inventoried kinds (LW-053).

**Security:** Replay CSRF is mitigated by same-origin BFF cookie + idempotency key + safe returnPath. No GET replay. Pending payload is livelihood JSON, not credentials. Cross-tab auth-cleared broadcast (LW-083) must stop a sibling from writing after logout.

**Operations:** Support: “sign in again; the save retries once.” Duplicate-apply bugs are investigated via idempotency keys in audit.

**Cost:** Browser storage only; no new Azure queue.

**Teams:** Working desk is the primary beneficiary. Guided eval chrome may share the wrapper where the same mutate APIs run.

## Consequences

- **Positive:** Quoteable answer to “which mutations resume after 401?” — inventoried livelihood writes, not GET, not auth, not billing.
- **Negative:** Broader `localStorage` WIP surface; must not be mistaken for server-synced user preferences.
- **Follow-ups:** LW-003 inventory · LW-051 localStorage v2 · LW-053 wrapper · kinds LW-055–062 · ratchets LW-069/070.
