> **Scope:** ADR 0088 — Draft PATCH compare-and-swap is mandatory unless `forceOverwrite`.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0088: Draft PATCH CAS is mandatory unless forceOverwrite

- **Status:** Proposed
- **Date:** 2026-09-10
- **Owner decision:** Omitting `expectedUpdatedUtc` on a `Drafting` architecture draft PATCH is **not** last-write-wins. Clients must send a matching token or an audited `forceOverwrite: true` (lost-write LW-001).

## Context

`DraftPatchStaleUpdatedUtcGuard` historically returned early when `expectedUpdatedUtc` was null. Online Working persist usually sent the token. Offline queue replay, CLI `DraftNewCommandAdmitStage`, guided intake, and any omit-token client silently overwrote the server document.

Architects sit in this product much of the day. A colleague’s in-flight draft, or this tab’s own unsaved replay after reconnect, must not vanish without a 409. ADR 0076 already fail-closes finding disposition races; draft PATCH was the leftover LWW hole (LK-12 opt-in token).

**Related:** ADR 0048 (mutable draft lifecycle), ADR 0071 (working-document undo vs sealed amend — 300s toast unchanged), ADR 0076 (disposition 409). Lease (ADR 0090) does **not** replace this CAS.

**HTTP:** omit-token and stale-token both return **409 Conflict**. Distinct ProblemDetails `errorCode` values: `draft_cas_token_missing` vs `draft_cas_stale`.

## Decision

1. **Token required:** `PATCH` on a mutable architecture draft **must** send `expectedUpdatedUtc` that equals the current server `updatedUtc`, unless `forceOverwrite` is true.
2. **Omit is conflict:** Missing token is **409**, not 200 last-write-wins. Same status as stale so existing Keep mine / Keep server chrome can open; copy must not claim “another session” when this tab never sent a version.
3. **forceOverwrite:** The only skip. Keep mine remains an explicit career action and must write a Required durable audit (LW-015). CAS remains mandatory even when a work-lease is held (ADR 0090).
4. **Not in scope:** Live presence, finding-comment chat, merging `DraftRequests`/`Runs`, unsealing, or flipping host `AgentExecution:Mode` (G-REAL-06).

## Trade-offs

**Gains:** Two architects (or online persist vs offline replay) cannot silently overwrite each other. CLI and forgotten clients fail closed instead of corrupting the livelihood document. Reviewers can quote this ADR for “may this PATCH omit expectedUpdatedUtc?” — the answer is no.

**Sacrifices:** Extra 409s for clients that never stored `updatedUtc` (guided intake first PATCH, v1 offline queue leftovers, older CLI). Operators must Keep mine or reload instead of assuming save always wins. Integrators see a behavior change: omit-token PATCH that used to 200 now 409s.

**Rejected:** HTTP 400 for omit-token (would fork the existing 409 conflict panel). Making the OpenAPI field JSON-required (would break `forceOverwrite` without a token). Silent LWW for “trusted” CLI.

## Constraints

- **Do not** merge `DraftRequests` and `Runs` (ADR 0068).
- **Do not** unseal sealed records (ADR 0039).
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- OpenAPI may keep `expectedUpdatedUtc` / `forceOverwrite` JSON-optional; fail-closed is server behavior plus description (LW-024). Wire snapshot updates follow `docs/library/API_CONTRACTS.md`.
- SQL stays in `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus numbered migrations — this ADR does not add tables.

## Expected impact

**System:** Guard throws on omit; CLI, UI persist, guided intake, and offline replay must send the token. Application tests that constructed `PatchDraftRequest` without a token start 409ing until they copy `created.UpdatedUtc`.

**Security:** Closes lost-update / cross-tab overwrite of a working architect’s draft. forceOverwrite remains a deliberate overwrite and must be audited so it is not a quiet privilege. No new public exposure; same tenant catalog isolation (ADR 0037).

**Operations:** Expect a short window of 409s from stale CLI builds and v1 queued patches. Support copy: reload or Keep mine — not “save failed randomly.”

**Cost:** No new Azure services. Extra GET-before-PATCH on a few guided-intake paths is a round-trip, not a new store.

**Teams:** Working desk already has Keep mine. Guided / demo must not imply real-time collab.

## Consequences

- **Positive:** Quoteable fail-closed draft CAS; omit-token LWW is unauthorized.
- **Negative:** Breaking HTTP behavior for omit-token PATCH (see `docs/architecture/LOST_WRITE_CAS_COMPAT.md` and `BREAKING_CHANGES.md`).
- **Follow-ups:** LW-013 guard · LW-014 ProblemDetails codes · LW-015 forceOverwrite audit · LW-023 CLI · LW-036+ offline queue v2.
