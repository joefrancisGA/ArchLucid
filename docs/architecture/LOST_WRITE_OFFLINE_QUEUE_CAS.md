> **Scope:** Contributor contract — offline draft queue must carry CAS (ADR 0088 / LW-006).

# Offline draft queue CAS contract

Queued `PATCH` of an architecture draft is a livelihood write. After ADR 0088 it **must not** last-write-wins.

## Enqueue

- Source of token: `serverUpdatedUtcRef` (last successful GET/create/PATCH `updatedUtc`) on the Working desk.
- `buildArchitectureDraftPatchPayload` stays **field-only** (intent, outcome, name, actors, brief, open questions). Do not overload it with CAS.
- Wrapper `withDraftPatchCas` (or equivalent) adds `expectedUpdatedUtc` and optional `forceOverwrite`.
- Queue schema v2 stores `expectedUpdatedUtc` on the **entry** (not only inside `payloadJson`) so replay cannot “forget” the token if payload JSON is rebuilt.

## Replay

- Replay **must** send `expectedUpdatedUtc` or `forceOverwrite: true`.
- Replay **must not** call `patchDraftRequest` with a body that omits **both**.
- **409** must not dequeue. Open Keep mine / Keep server. No empty `catch { break; }` that drops the entry after a silent skip.
- Dequeue **only** on 2xx. Keep the entry on 401, 409, and 5xx.
- **v1** entries without a token: conflict-on-replay (GET/compare or show conflict). **Never** omit-token PATCH after 0088.

## Out of contract

Automatic `forceOverwrite` on replay is forbidden (that is the new LWW). Favorites/recents are not this queue.
