> **Scope:** Contributor contract — omit-token draft PATCH after ADR 0088. Not a buyer doc.

# Lost-write CAS compatibility (ADR 0088)

**HTTP pick (stuck):** omit-token and stale-token both return **409 Conflict**.

| Situation | HTTP | `errorCode` / `code` | Title (ProblemDetails) | Client action |
|-----------|------|----------------------|------------------------|---------------|
| `forceOverwrite: true` | 2xx on success | — | — | Audited Keep mine (LW-015) |
| Matching `expectedUpdatedUtc` | 2xx | — | — | Persist; adopt response `updatedUtc` |
| Stale `expectedUpdatedUtc` | **409** | `draft_cas_stale` | Draft CAS stale | Keep mine / Keep server — another writer changed the document |
| Omit token and not forceOverwrite | **409** | `draft_cas_token_missing` | Draft CAS token missing | Client bug or v1 queue leftover — **not** “another session” copy |

OpenAPI today (LW-010 snapshot): `expectedUpdatedUtc` and `forceOverwrite` remain **JSON-optional**. Do not regenerate the snapshot in the same change as the guard flip unless LW-024 is in scope. Fail-closed is the guard, not `required: []` in JSON Schema.

## In-repo clients (fixer prompts)

| Client | Before 0088 | Fixer |
|--------|-------------|-------|
| Online persist (`use-architecture-draft-autosave-persist`) | Sends token when `serverUpdatedUtcRef` set | LW-029 / LW-032 first-save token |
| Offline replay | Field payload only (LWW) | LW-036–042 |
| CLI `DraftNewCommandAdmitStage` | Omitted token | LW-023 |
| Guided intake create/admit | Omitted token | LW-029 family |
| Start-review scope PATCH | Omitted token | LW-022 / UI CAS |
| `ArchLucid.Application.Tests` `PatchAsync` | Often omitted | Tests copy `created.UpdatedUtc` |

Demo/in-memory hosts use the same `DraftPatchStaleUpdatedUtcGuard` (LW-026). Do not fork a silent LWW demo path without honesty copy (LW-027).
