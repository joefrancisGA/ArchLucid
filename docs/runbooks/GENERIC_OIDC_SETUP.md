> **Scope:** Operators configuring non-Microsoft OIDC issuers for `ArchLucidAuth:Authority` — authoritative checklist for JwtBearer + discovery/JWKS; not Entra tenant onboarding, SAML SP flows, nor a threat model.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Generic OIDC issuer setup (`ArchLucidAuth:Authority`)

Use this path when **`ArchLucidAuth:Mode=JwtBearer`** and the issuer is **not** Microsoft Entra — for example **Okta**, **Auth0**, **Keycloak**, or another OIDC provider that publishes **`/.well-known/openid-configuration`** and JWKS.

IdP-specific screenshots and expressions live in **[SSO — Okta](../integrations/SSO_OKTA_CONFIGURATION.md)** and **[SSO — Auth0](../integrations/SSO_AUTH0_CONFIGURATION.md)**; this runbook is the **cross-vendor** sequence and troubleshooting layer.

---

## 1. Preconditions

| Input | Constraint |
| --- | --- |
| **`ArchLucidAuth:Authority`** | Base URL of the issuer whose OIDC metadata document is reachable from the API host (HTTPS). Typical shapes: `https://tenant.auth0.com/`, `https://dev-xxxx.okta.com/oauth2/default`. |
| **`ArchLucidAuth:Audience`** | Exact match for the **`aud`** claim on access tokens your clients send to ArchLucid (resource/API identifier). |
| **`ArchLucidAuth:MultiTenantEntra`** | **`false`** for generic OIDC. When **`true`**, **`EntraMultiTenantJwtBearerConfigurator`** restricts issuers to Entra v2 patterns — non-Entra tokens fail issuer validation. |

The API uses ASP.NET Core **JwtBearer** with **`Authority`** set: middleware loads **`{Authority}/.well-known/openid-configuration`**, resolves **`jwks_uri`**, and validates signatures (RSA keys by default).

---

## 2. Step-by-step — ArchLucid configuration

1. Set **`ArchLucidAuth:Mode`** to **`JwtBearer`**.
2. Set **`ArchLucidAuth:Authority`** to your issuer root (see Issuer URI in your IdP console — often ends with **`/`**).
3. Set **`ArchLucidAuth:Audience`** to the API identifier used when minting tokens.
4. Ensure **`ArchLucidAuth:MultiTenantEntra`** is **`false`** (explicitly in production configs).
5. Do **not** set **`ArchLucidAuth:JwtSigningPublicKeyPemPath`** unless you intentionally bypass OIDC discovery for PEM-only validation (CI/local pattern — see **`ArchLucidJwtBearerConfiguration`**).

Example (environment-variable style):

```text
ArchLucidAuth__Mode=JwtBearer
ArchLucidAuth__Authority=https://your-tenant.auth0.com/
ArchLucidAuth__Audience=api://archlucid
ArchLucidAuth__MultiTenantEntra=false
```

6. Optional: **`ArchLucidAuth:NameClaimType`** — JWT claim used as the display/user name after validation (defaults align with **`ClaimTypes.Name`**; many IdPs use **`preferred_username`**, **`name`**, or **`email`** — match what your tokens emit).

---

## 3. Claim mapping to ArchLucid roles (`ArchLucidRoles`)

**Role names** are defined as constants on **`ArchLucid.Core.Authorization.ArchLucidRoles`** (`Admin`, `Operator`, `Reader`, `Auditor`, …). Policies expect those **string values** after **`ArchLucidRoleClaimsTransformation`** runs.

The pipeline collects roles from:

- **`roles`** (JWT short name),
- **`ClaimTypes.Role`** / **`http://schemas.microsoft.com/ws/2008/06/identity/claims/role`**,
- **`http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role`** (common SAML-derived URIs).

JWT bearer options set **`RoleClaimType = "roles"`**. Configure your IdP so **access tokens** carry ArchLucid-facing roles using claim(s) that resolve into that type — practically: emit a **`roles`** claim whose values match **`ArchLucidRoles`** (case-insensitive).

### Examples

**Single role (string scalar)**

```json
"roles": "Operator"
```

**Multiple roles (duplicate claims or JSON array string)**

Duplicate **`roles`** entries **or** a single claim whose value is a JSON array **`["Operator","Auditor"]`** — both shapes are expanded by **`ArchLucidRoleClaimsTransformation`**.

**Okta**

Map groups or expressions into an **`roles`** claim on the **access token**. Example pattern (groups → role strings): see **[SSO — Okta §2.3](../integrations/SSO_OKTA_CONFIGURATION.md)**.

**Auth0**

Use an Action to **`api.accessToken.setCustomClaim('roles', assignedRoles)`** with role names **`Admin`**, **`Operator`**, **`Reader`**, **`Auditor`**. See **[SSO — Auth0 §2.3](../integrations/SSO_AUTH0_CONFIGURATION.md)**.

### Microsoft Entra ID (OIDC / JWT bearer)

When **`ArchLucidAuth:Mode=JwtBearer`** with Entra as issuer:

| Setting | Typical value |
| --- | --- |
| **`Authority`** | `https://login.microsoftonline.com/{tenant-id}/v2.0` |
| **`Audience`** | App registration **Application ID URI** or client id (must match token **`aud`**) |
| **`MultiTenantEntra`** | `true` only when validating multi-tenant v2 issuers; otherwise `false` for single-tenant apps |

**App roles → token `roles` claim:** Define app roles in the Entra app registration (`Admin`, `Operator`, `Reader`, `Auditor`) and assign users/groups. Access tokens should include **`roles`** as a JSON array. If users receive **403** with valid **401** boundary, verify **Enterprise applications → Users and groups** assignments and that the client requests the API scope exposing app roles.

**Common misconfiguration:** Using the **ID token** instead of an **access token** for API calls, or setting **`Audience`** to the Graph resource while tokens are minted for your custom API identifier.

If authenticated requests return **403** while **401** is gone, decode a sample token (non-production) and confirm **`roles`** contains at least one known **`ArchLucidRoles`** value. Unmapped roles are recorded in the auth diagnostics ring buffer (see **`ArchLucidRoleClaimsTransformation`**).

Full RBAC table: **[SECURITY.md](../library/SECURITY.md)** (Role-based access control).

---

## 4. Troubleshooting — JWKS and validation errors

| Symptom / log | Likely cause | What to verify |
| --- | --- | --- |
| **`IDX10501`** / signature validation failed | Wrong **`Authority`**, wrong signing key, or cached JWKS stale vs rotating keys | Confirm **`iss`** in JWT equals discovery **`issuer`**. Fetch **`openid-configuration`** and **`jwks_uri`** manually from the API network; compare **`kid`** in JWT header to a JWK entry. |
| **`IDX10205`** / issuer validation failed | **`Authority`** base URL does not match token **`iss`** (trailing slash, wrong auth server path, realm typo) | Normalize issuer URL with IdP docs; for Okta use full **`oauth2/{serverId}`** path, not only org URL. |
| **`IDX10214`** / audience validation failed | **`ArchLucidAuth:Audience`** ≠ token **`aud`** | Remember **`aud`** can be a string or array — ArchLucid must match the configured audience string your IdP issues for this API. Use **access tokens**, not ID tokens, when calling the API. |
| **`IDX10223`** (typical) / lifetime validation failed | Clock skew or wrong **`nbf`/`exp`** | Sync VM/container time (NTP); check IdP clock. Exact IDX text varies slightly by **`Microsoft.IdentityModel.Tokens`** version — search logs for **`Lifetime`** / **`nbf`** / **`exp`**. |
| Metadata fetch timeouts / TLS errors | Egress firewall, TLS inspection, proxy | Ensure API host can reach **`Authority`** HTTPS and JWKS URL; corporate proxies may need allowlisting. |
| **401** then fixed without config change | JWKS rotation delay | Middleware caches signing keys; transient failures during rotation usually clear after refresh — persist failures point to **`kid`** not published in JWKS. |

Decode JWTs only with **non-production** credentials. Prefer **`GET`** discovery documents and **`jwks`** over pasting secrets into third-party sites.

---

## 5. Smoke test

1. Obtain an **access token** for your ArchLucid API audience from the IdP.
2. **`curl -H "Authorization: Bearer <token>" https://<api-host>/version`** → **200**.
3. Hit an **`ExecuteAuthority`** route with an **`Operator`** (or higher) principal → **200**, not **403**.

Drill parity: **`docs/library/V1_RC_DRILL.md`** and **`v1-rc-drill.ps1`** (**`-BearerToken`**).

---

## Related docs

- **[SECURITY.md](../library/SECURITY.md)** — modes, **`RequireJwtBearerInProduction`**, RBAC table.
- **[CONFIGURATION_REFERENCE.md](../library/CONFIGURATION_REFERENCE.md)** — full **`ArchLucidAuth:*`** catalog.
- **[V1_SCOPE.md](../library/V1_SCOPE.md)** — OIDC issuer scope (section 2.12).
