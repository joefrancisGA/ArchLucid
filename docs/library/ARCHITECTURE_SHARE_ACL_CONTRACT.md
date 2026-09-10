# Architecture share ACL contract (AS-090)

Architecture-scoped sharing is **inside one tenant**. It does not replace ADR 0037 catalog isolation and does not add SQL row-level security (AS-097).

## Roles

| Role | View restricted package | Decide on restricted package | Manage shares / restrict flag |
| --- | --- | --- | --- |
| **View** | Yes (when shared) | No | No |
| **Decide** | Yes (when shared) | Yes, only when caller also has **ExecuteAuthority** | No |
| **Admin** | Yes (when shared) | Yes, only when caller also has **ExecuteAuthority** | Yes |

When `RestrictToShares = false` (grandfather default, AS-088), every workspace member with ReadAuthority can view the architecture. ExecuteAuthority gates decide actions as today.

## Actor keys (AS-096)

- Share rows store `ActorOid` as the Entra user key from `IActorContext.GetActorId()` (`jwt:{tenantId}:{oid}`).
- SCIM group ids (`group:` / `scim-group:`) are rejected with HTTP 400.

## Restrict-to-shares (AS-089)

- Opt-in only. Default remains open.
- Enabling restrict while the share list is empty **auto-inserts the current actor as Admin** so the operator cannot hide the package from everyone including themselves.
- Operators must set `confirmRestrict = true` when enabling restrict.

## Visibility (AS-094 / AS-095)

- Architecture list and get endpoints pass the caller oid into repository filters.
- Restricted architectures without a matching share row are omitted from list results and return **404** on get (IDOR-safe; no existence leak).

## Audit (AS-093)

Required durable audit events:

- `ArchitectureIdentity.ShareGranted`
- `ArchitectureIdentity.ShareRevoked`
- `ArchitectureIdentity.RestrictToSharesEnabled`
- `ArchitectureIdentity.RestrictToSharesDisabled`

## API surface (AS-099)

| Method | Path | Authority |
| --- | --- | --- |
| GET | `/v1/architectures/{architectureId}/shares` | ReadAuthority |
| PUT | `/v1/architectures/{architectureId}/shares` | ExecuteAuthority |
| DELETE | `/v1/architectures/{architectureId}/shares/{targetActorOid}` | ExecuteAuthority |
| PATCH | `/v1/architectures/{architectureId}/restrict-to-shares` | ExecuteAuthority |

## Security / scalability / reliability / cost

- **Security:** Application-layer ACL only; tenant scope enforced on every repository query; hidden restricted rows return 404.
- **Scalability:** Share list is per architecture (small cardinality); list filter uses indexed `ArchitectureShares(ActorOid)` join.
- **Reliability:** Restrict enable is fail-closed with auto-admin bootstrap; audit writes use durable retry (`LogOrThrowAsync`).
- **Cost:** No extra services; one additional join on architecture list when actor filter is supplied.
