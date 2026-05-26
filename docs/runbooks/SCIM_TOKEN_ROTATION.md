> **Scope:** Runbook — rotate SCIM 2.0 inbound provisioning bearer tokens per tenant without breaking Microsoft Entra ID or Okta provisioning jobs.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Runbook: SCIM 2.0 bearer token rotation

**Last reviewed:** 2026-05-26

**Priority:** P2 — Important (IdP provisioning stops when the bearer secret is revoked or expires)

## Summary

ArchLucid authenticates inbound SCIM requests with the dedicated **`ScimBearer`** scheme. Each tenant may hold one or more active rows in **`dbo.ScimTenantTokens`**. Plaintext tokens are shown **once** at issuance; only an Argon2 hash is persisted.

**Zero-downtime pattern:** issue a **new** token, update the IdP provisioning app with the new secret, validate a provisioning cycle, then **revoke** the old token.

## Symptoms

- Entra / Okta provisioning logs show **401 Unauthorized** against `POST /v1/scim/v2/Users` (or Groups).
- **`ScimTokenRotationReminderJob`** audit/email reminders for tokens older than the configured rotation window.
- Operator UI or **`GET /v1/admin/scim/tokens`** shows multiple active tokens after a partial rotation.

## Configuration reference

| Key / surface | Purpose |
|---------------|---------|
| **`POST /v1/admin/scim/tokens`** | Issues a new token (Admin authority; returns `plaintextToken` once). |
| **`GET /v1/admin/scim/tokens`** | Lists token metadata (`id`, `createdUtc`, `revokedUtc`, `publicLookupKey`). |
| **`DELETE /v1/admin/scim/tokens/{id}`** | Revokes a token (`RevokedUtc = SYSUTCDATETIME()`). |
| **`dbo.ScimTenantTokens`** | Persists `PublicLookupKey`, `SecretHash`, `CreatedUtc`, `RevokedUtc` per tenant. |
| **IdP secret field** | Entra enterprise app **Secret Token** or Okta **SCIM Bearer Token** — paste the full `archlucid_scim.{public}.{secret}` value. |

Security context: [`SECURITY.md`](../library/SECURITY.md) · API key rotation (automation principals): [`API_KEY_ROTATION.md`](./API_KEY_ROTATION.md).

## 1. Preconditions

1. **Admin authority** JWT/API key for the target tenant scope.
2. **Change window** with the IdP admin who can edit the provisioning app secret.
3. Capture baseline: **`GET /v1/admin/scim/tokens`** JSON (note active token ids and ages).
4. Confirm SCIM base URL in the IdP matches your deployment (`https://{host}/v1/scim/v2`).

## 2. Issue a replacement token (API — preferred)

```http
POST /v1/admin/scim/tokens HTTP/1.1
Host: {your-api-host}
Authorization: Bearer {admin-jwt-or-api-key}
Accept: application/json
```

Example response (store `plaintextToken` in your secret manager immediately):

```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "publicLookupKey": "abc123",
  "plaintextToken": "archlucid_scim.abc123.secretpart"
}
```

The handler calls **`ScimTokenIssuer`**, which:

1. Generates random public and secret segments.
2. Hashes the secret with **`ScimArgonSecretHasher`** (tenant-scoped salt).
3. Inserts into **`dbo.ScimTenantTokens`**.

## 3. Issue a replacement token (SQL — break-glass)

Use only when the Admin API is unavailable. Replace `{TenantId}` and generate cryptographically random URL-safe segments offline.

```sql
-- 1) Insert row (SecretHash must be produced by the application hasher — prefer API issuance).
-- 2) If API is down, restore service first; do not hand-craft Argon hashes in production.

SELECT Id, TenantId, PublicLookupKey, CreatedUtc, RevokedUtc
FROM dbo.ScimTenantTokens
WHERE TenantId = '{TenantId}'
ORDER BY CreatedUtc DESC;
```

Revoke stale token:

```sql
UPDATE dbo.ScimTenantTokens
SET RevokedUtc = SYSUTCDATETIME()
WHERE Id = '{TokenId}'
  AND TenantId = '{TenantId}'
  AND RevokedUtc IS NULL;
```

## 4. Update Microsoft Entra ID

1. **Enterprise applications** → your ArchLucid SCIM provisioning app → **Provisioning**.
2. **Edit provisioning** → **Admin credentials** → update **Secret Token** with the new `plaintextToken`.
3. **Test connection** (Entra test button) or wait for the next sync cycle.
4. Confirm users/groups sync without 401 in Entra provisioning logs.

## 5. Update Okta

1. **Applications** → ArchLucid SCIM app → **Provisioning** → **Integration**.
2. Update **SCIM Bearer Token** with the new `plaintextToken`.
3. **Test connector** or trigger **Import Now**.
4. Confirm Okta System Log shows successful SCIM calls.

## 6. Revoke the previous token

After the IdP confirms successful provisioning with the new secret:

```http
DELETE /v1/admin/scim/tokens/{old-token-id} HTTP/1.1
Host: {your-api-host}
Authorization: Bearer {admin-jwt-or-api-key}
```

Verify **`revokedUtc`** is set on the old row via **`GET /v1/admin/scim/tokens`**.

## 7. Validation checklist

- [ ] IdP provisioning test succeeds (no 401/403).
- [ ] New token row appears in **`dbo.ScimTenantTokens`** with `RevokedUtc IS NULL`.
- [ ] Old token row has **`RevokedUtc`** populated.
- [ ] Audit events **`ScimTokenIssued`** / **`ScimTokenRevoked`** present for the tenant.
- [ ] No plaintext token stored in tickets, chat, or git — use Key Vault / secret store only.

## 8. Rollback

If the new token fails:

1. Re-enter the **previous** plaintext token in the IdP (if still active and not revoked).
2. If the old token was already revoked, issue another new token and repeat cutover.
3. Do **not** delete rows from **`dbo.ScimTenantTokens`**; use **`RevokedUtc`** only.

## References

- [`SECRET_AND_CERT_ROTATION.md`](./SECRET_AND_CERT_ROTATION.md)
- [`API_KEY_ROTATION.md`](./API_KEY_ROTATION.md)
- SCIM admin controller: `ArchLucid.Api/Controllers/Admin/ScimTokensAdminController.cs`
