> **Scope:** Operators configuring non-Microsoft OIDC issuers for `ArchLucidAuth:Authority` — step checklist only; not Entra-specific onboarding nor a threat model.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Generic OIDC issuer setup (`ArchLucidAuth:Authority`)

Use this path when **`ArchLucidAuth:Mode=JwtBearer`** and the issuer is **not** Microsoft Entra — for example **Okta**, **Auth0**, **Keycloak**, or another standards-compliant OIDC provider.

## 1. Point authority at the issuer metadata

Set **`ArchLucidAuth:Authority`** to the issuer root your IdP documents (must expose **`/.well-known/openid-configuration`**).

Match **`ArchLucidAuth:Audience`** to the API identifier / resource name your IdP puts in **`aud`** (exact string equality is enforced by default JWT validation).

## 2. Map roles into `ArchLucidRoles`

ArchLucid reads comma-separated roles from the **`ArchLucidRoles`** claim (see **`SECURITY.md`** shipped-auth section).

Configure your IdP to emit **`ArchLucidRoles`** as either:

- A **string** claim containing comma-separated role tokens (`Admin`, `ExecuteAuthority`, …), or  
- A **JSON array** of role strings if your gateway normalizes arrays into repeated claims (depends on handler mapping).

If your IdP only exposes `groups` or vendor-specific claims, use the IdP’s **token customization / claims pipeline** to project them into **`ArchLucidRoles`** (or into a claim your reverse proxy rewrites).

## 3. Clock skew and HTTPS

- Serve the API over **HTTPS** in every non-local environment.  
- Keep container / VM clocks synchronized (NTP). Large skew breaks JWT **`nbf` / `exp`** validation.

## 4. JWKS / issuer mismatches (common failures)

| Symptom | Likely cause |
|---------|----------------|
| `401` with IDX10501 / signature failures | Wrong authority string, stale JWKS cache, or mismatch between signing key and issuer metadata URL. |
| `403` after `401` clears | Roles claim missing — user authenticated but lacks **`ArchLucidRoles`** mapping to an ArchLucid policy. |
| Audience failures | **`ArchLucidAuth:Audience`** does not match token **`aud`** (including trailing-slash vs resource URI differences). |

**Mitigation:** Fetch issuer metadata manually (`openid-configuration`), confirm **`jwks_uri`**, **`issuer`** string equality with tokens, and decode a sample JWT at [jwt.io](https://jwt.io) **only with non-production tokens**.

## 5. Smoke-test checklist

1. Obtain an access token from the IdP with the API audience.  
2. `curl -H "Authorization: Bearer …" https://<api-host>/version` → **200**.  
3. Call a scoped route with an **`ExecuteAuthority`** principal → **200** (not **403**).  

For scripted parity against **`DevelopmentBypass`**, see **`docs/library/V1_RC_DRILL.md`** and **`v1-rc-drill.ps1`** (**`-BearerToken`** / **`-ApiKey`**).

## Related docs

- **`docs/library/SECURITY.md`** — authentication modes and shipped defaults.  
- **`docs/library/CONFIGURATION_REFERENCE.md`** — `ArchLucidAuth:*` keys.  
- **`docs/library/API_CONTRACTS.md`** — HTTP surface of record.
