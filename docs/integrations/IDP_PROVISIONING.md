> **Scope:** OIDC/JWT SSO configuration for ArchLucid API against **secondary** identity providers — Auth0 and Okta. Covers per-provider tenant/application setup, custom `roles` claim mapping, ArchLucid-side `ArchLucidAuth` configuration, token verification, and troubleshooting. Audience: enterprise IT / identity administrators using Auth0 or Okta instead of Entra ID. Does **not** modify ArchLucid auth code; references existing auth paths for contributor context.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

> **Merged:** 2026-07-20 — combines the former `SSO_AUTH0_CONFIGURATION.md` and `SSO_OKTA_CONFIGURATION.md` into one provider-comparison doc; provider-specific steps live in their own numbered sections below, shared configuration/troubleshooting is written once.

# IdP provisioning — Auth0 and Okta SSO configuration

**Last reviewed:** 2026-07-20

## 1. Overview

ArchLucid authenticates API requests via **JWT bearer tokens** validated by the ASP.NET Core `JwtBearer` middleware. When `ArchLucidAuth:Mode` is set to `JwtBearer`, the API downloads OIDC metadata from the configured `Authority`, validates the token signature, audience, issuer, and lifetime, then maps the `roles` claim to internal authorization policies.

> **Primary IdP:** Microsoft Entra ID is the primary supported identity provider. ArchLucid's multi-tenant Entra support, SCIM provisioning, and trial authentication features are built and tested against Entra. This guide covers **Auth0** and **Okta** for organizations whose workforce identity is managed there instead. The JWT bearer pipeline is standards-based (OIDC Discovery + RS256/RS384/RS512), so any compliant IdP works, but Auth0- and Okta-specific steps are called out below. For other OIDC issuers (Keycloak, etc.), see [`runbooks/GENERIC_OIDC_SETUP.md`](../runbooks/GENERIC_OIDC_SETUP.md).

### What ArchLucid expects from the IdP

| Requirement | Detail |
|-------------|--------|
| **Protocol** | OIDC / OAuth 2.0 with JWT access tokens |
| **Discovery** | `/.well-known/openid-configuration` at the Authority URL |
| **Signing** | RSA (RS256 recommended) — keys published via JWKS (`jwks_uri`) |
| **Audience (`aud`)** | Must match `ArchLucidAuth:Audience` (e.g. `api://archlucid`) |
| **Issuer (`iss`)** | Must match the OIDC Discovery `issuer` field at the Authority URL |
| **Roles claim** | `roles` array (or mapped via `ArchLucidRoleClaimsTransformation`) containing one of: `Admin`, `Operator`, `Reader`, `Auditor` |
| **Name claim** | `preferred_username`, `name`, `email`, or configured via `ArchLucidAuth:NameClaimType` |

**Contributor context:** JWT bearer configuration lives in `ArchLucid.Api/Auth/Services/AuthServiceCollectionExtensions.cs` (`ConfigureJwtBearer`). Role-to-permission mapping is in `ArchLucid.Api/Auth/Services/ArchLucidRoleClaimsTransformation.cs`. Options model: `ArchLucid.Api/Auth/Models/ArchLucidAuthOptions.cs`. Authorization policies: `ArchLucid.Core/Authorization/ArchLucidPolicies.cs` and `ArchLucid.Core/Authorization/ArchLucidRoles.cs`.

---

## 2. Auth0-side configuration

### 2.1 Register an API

1. Sign in to the **Auth0 Dashboard**.
2. Navigate to **Applications → APIs → Create API**.
3. Configure:
   - **Name:** `ArchLucid API`
   - **Identifier (Audience):** `api://archlucid` (this value becomes the `aud` claim; must match `ArchLucidAuth:Audience`)
   - **Signing Algorithm:** RS256

Record the **API Audience** value — you will use it in ArchLucid configuration.

### 2.2 Create an application

1. Navigate to **Applications → Applications → Create Application**.
2. Choose the appropriate type:
   - **Regular Web Application** — if the ArchLucid UI initiates the login (authorization code + PKCE).
   - **Machine to Machine** — if a CI/CD pipeline or CLI calls the API with client credentials.
3. Configure the application:
   - **Name:** `ArchLucid`
   - **Allowed Callback URLs:** `https://<your-archlucid-ui-host>/api/auth/callback/auth0`
   - **Allowed Logout URLs:** `https://<your-archlucid-ui-host>`
   - **Allowed Web Origins:** `https://<your-archlucid-ui-host>`
4. On the **APIs** tab, authorize the application for the `ArchLucid API` audience.

Record the **Domain**, **Client ID**, and **Client Secret** (for confidential clients).

### 2.3 Add a custom `roles` claim via Auth0 Actions

Auth0 does not include a `roles` claim in access tokens by default. Use an **Auth0 Action** (post-login trigger) to inject it.

1. Navigate to **Actions → Library → Build Custom**.
2. Create a new Action:
   - **Name:** `Add ArchLucid roles`
   - **Trigger:** Login / Post Login
3. Add the following code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'roles';

  const assignedRoles = event.authorization?.roles || [];

  if (assignedRoles.length > 0) {
    api.accessToken.setCustomClaim(namespace, assignedRoles);
  }
};
```

4. **Deploy** the Action.
5. Navigate to **Actions → Flows → Login** and drag the new Action into the flow.

> **Important:** Auth0 namespaced claims (e.g. `https://archlucid.net/roles`) are common in Auth0 tutorials, but ArchLucid reads the claim named exactly `roles`. The Action above sets a top-level `roles` claim. If your Auth0 tenant requires namespaced claims, you must also set `ArchLucidAuth:NameClaimType` or adjust the `RoleClaimType` — contact ArchLucid support for guidance.

### 2.4 Create Auth0 roles

1. Navigate to **User Management → Roles**.
2. Create roles that match ArchLucid's expected values:

| Auth0 role name | ArchLucid role | Authorization policy |
|-----------------|---------------|---------------------|
| `Admin` | `Admin` | `AdminAuthority` — host administration, policy-pack lifecycle |
| `Operator` | `Operator` | `ExecuteAuthority` — create runs, replays, governance actions |
| `Reader` | `Reader` | `ReadAuthority` — read-only access to runs, manifests, governance queries |
| `Auditor` | `Auditor` | `RequireAuditor` — audit CSV/JSON export, compliance-oriented access |

3. Assign users to the appropriate roles via **User Management → Users → \<user\> → Roles**.

---

## 3. Okta-side configuration

### 3.1 Create an API authorization server (or use the default)

1. Sign in to the **Okta Admin Console**.
2. Navigate to **Security → API**.
3. Use the **default** authorization server (`https://<your-okta-domain>/oauth2/default`) or create a **custom** one:
   - **Name:** `ArchLucid API`
   - **Audience:** `api://archlucid` (must match the value you configure in ArchLucid)
   - **Description:** ArchLucid architecture workflow API

Record the **Issuer URI** shown on the authorization server settings page (e.g. `https://dev-123456.okta.com/oauth2/default`).

### 3.2 Create an OIDC application

1. Navigate to **Applications → Create App Integration**.
2. Select **OIDC - OpenID Connect**.
3. Choose the appropriate application type:
   - **Web Application** — if the ArchLucid UI initiates the login (authorization code + PKCE).
   - **Service (Machine-to-Machine)** — if a CI/CD pipeline or CLI calls the API with client credentials.
4. Configure the application:
   - **App integration name:** `ArchLucid`
   - **Grant types:** Authorization Code (+ PKCE for SPAs/public clients), or Client Credentials for M2M.
   - **Sign-in redirect URIs:** `https://<your-archlucid-ui-host>/api/auth/callback/okta` (adjust for your deployment).
   - **Sign-out redirect URIs:** `https://<your-archlucid-ui-host>` (optional).
   - **Controlled access:** Assign to the appropriate groups/people.

Record the **Client ID** and **Client Secret** (for confidential clients).

### 3.3 Add a custom `roles` claim

ArchLucid reads roles from the `roles` claim on the JWT access token. Okta does not include a `roles` claim by default — you must add one.

1. Navigate to **Security → API → \<your authorization server\> → Claims**.
2. Click **Add Claim**:
   - **Name:** `roles`
   - **Include in token type:** **Access Token** (always)
   - **Value type:** Expression
   - **Value:** an Okta Expression Language expression that maps groups to ArchLucid role strings.

**Example expression** (maps group membership to role strings):

```
isMemberOfGroupName("ArchLucid-Admins") ? "Admin" :
isMemberOfGroupName("ArchLucid-Operators") ? "Operator" :
isMemberOfGroupName("ArchLucid-Auditors") ? "Auditor" : "Reader"
```

> If you need **multiple roles per user**, use a Groups claim mapped to an array (see Okta docs on [customizing tokens with a Groups claim](https://developer.okta.com/docs/guides/customize-tokens-groups-claim/)). You can alternatively use a claim of type **Groups** with a filter, and configure the claim name as `roles`.

3. Verify the claim appears in the **Token Preview** tab with the expected value.

### 3.4 Create Okta groups

Create groups that correspond to ArchLucid roles:

| Okta group | ArchLucid role | Authorization policy |
|------------|---------------|---------------------|
| `ArchLucid-Admins` | `Admin` | `AdminAuthority` — host administration, policy-pack lifecycle |
| `ArchLucid-Operators` | `Operator` | `ExecuteAuthority` — create runs, replays, governance actions |
| `ArchLucid-Readers` | `Reader` | `ReadAuthority` — read-only access to runs, manifests, governance queries |
| `ArchLucid-Auditors` | `Auditor` | `RequireAuditor` — audit CSV/JSON export, compliance-oriented access |

Assign users to the appropriate groups.

---

## 4. ArchLucid-side configuration

Set the following values in `appsettings.json`, `appsettings.Production.json`, environment variables, or Azure Key Vault. The shared keys are the same for both providers — only `Authority`, `Audience`, and `NameClaimType` values differ.

| Key | Notes |
|-----|-------|
| `ArchLucidAuth:Mode` | `JwtBearer` — enables JWT bearer validation (not `ApiKey` or `DevelopmentBypass`) |
| `ArchLucidAuth:Authority` | The issuer base URL. The API appends `.well-known/openid-configuration` to download signing keys and metadata. **Auth0:** `https://<your-tenant>.auth0.com/` (**trailing slash required** — Auth0's issuer claim includes it; omitting it fails issuer validation). **Okta:** `https://<okta-domain>/oauth2/<auth-server-id>` (e.g. `https://dev-123456.okta.com/oauth2/default`). |
| `ArchLucidAuth:Audience` | `api://archlucid` — must match the **Identifier** (Auth0) or **Audience** (Okta) configured on the authorization server |
| `ArchLucidAuth:MultiTenantEntra` | **Must be `false`** for both providers — multi-tenant Entra issuer validation rejects non-Entra issuers (see `EntraMultiTenantJwtBearerConfigurator.cs`) |
| `ArchLucidAuth:NameClaimType` | **Auth0:** `name` by default; use `email` if your organization prefers email as the display identity. **Okta:** `preferred_username` (Okta tokens typically use `sub` or `preferred_username`). |

**Auth0 example:**

```json
{
  "ArchLucidAuth": {
    "Mode": "JwtBearer",
    "Authority": "https://your-tenant.auth0.com/",
    "Audience": "api://archlucid",
    "MultiTenantEntra": false,
    "NameClaimType": "name"
  }
}
```

**Okta example:**

```json
{
  "ArchLucidAuth": {
    "Mode": "JwtBearer",
    "Authority": "https://dev-123456.okta.com/oauth2/default",
    "Audience": "api://archlucid",
    "MultiTenantEntra": false,
    "NameClaimType": "preferred_username"
  }
}
```

### Environment variable form

**Auth0:**

```text
ArchLucidAuth__Mode=JwtBearer
ArchLucidAuth__Authority=https://your-tenant.auth0.com/
ArchLucidAuth__Audience=api://archlucid
ArchLucidAuth__MultiTenantEntra=false
ArchLucidAuth__NameClaimType=name
```

**Okta:**

```text
ArchLucidAuth__Mode=JwtBearer
ArchLucidAuth__Authority=https://dev-123456.okta.com/oauth2/default
ArchLucidAuth__Audience=api://archlucid
ArchLucidAuth__MultiTenantEntra=false
ArchLucidAuth__NameClaimType=preferred_username
```

### Disable API key authentication

When using JWT bearer (either provider), disable the API key scheme to avoid confusion:

```json
{
  "Authentication": {
    "ApiKey": {
      "Enabled": false,
      "DevelopmentBypassAll": false
    }
  }
}
```

---

## 5. Verification

### 5.1 Obtain a token

**Auth0 — Authorization code flow** (interactive — use for testing):

```bash
# Open in browser to initiate OIDC login:
# https://your-tenant.auth0.com/authorize?\
#   response_type=code&client_id=<CLIENT_ID>&redirect_uri=<REDIRECT_URI>\
#   &audience=api://archlucid&scope=openid profile&state=test123

# Exchange the authorization code for tokens:
curl -s -X POST \
  "https://your-tenant.auth0.com/oauth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "client_id": "<CLIENT_ID>",
    "client_secret": "<CLIENT_SECRET>",
    "code": "<AUTH_CODE>",
    "redirect_uri": "<REDIRECT_URI>"
  }'
```

**Auth0 — Client credentials flow** (M2M / CI):

```bash
curl -s -X POST \
  "https://your-tenant.auth0.com/oauth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "<CLIENT_ID>",
    "client_secret": "<CLIENT_SECRET>",
    "audience": "api://archlucid"
  }'
```

**Okta — Authorization code flow** (interactive — use for testing):

```bash
# Open in browser to initiate OIDC login:
# https://dev-123456.okta.com/oauth2/default/v1/authorize?\
#   response_type=code&client_id=<CLIENT_ID>&redirect_uri=<REDIRECT_URI>\
#   &scope=openid profile&state=test123

# Exchange the authorization code for tokens:
curl -s -X POST \
  "https://dev-123456.okta.com/oauth2/default/v1/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=<AUTH_CODE>" \
  -d "redirect_uri=<REDIRECT_URI>" \
  -d "client_id=<CLIENT_ID>" \
  -d "client_secret=<CLIENT_SECRET>"
```

**Okta — Client credentials flow** (M2M / CI):

```bash
curl -s -X POST \
  "https://dev-123456.okta.com/oauth2/default/v1/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=<CLIENT_ID>" \
  -d "client_secret=<CLIENT_SECRET>" \
  -d "scope=archlucid"
```

### 5.2 Call the ArchLucid health endpoint

```bash
# Readiness check (authenticated)
curl -s -w "\nHTTP %{http_code}\n" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  "https://<archlucid-host>/health/ready"
```

Expected: HTTP 200 with `Healthy` or a JSON health report.

### 5.3 Inspect the authenticated principal

```bash
curl -s \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  "https://<archlucid-host>/api/auth/me" | jq .
```

Verify the response includes:
- `name` (Auth0) or `preferred_username` (Okta) matching the IdP user
- `roles` containing the expected ArchLucid role (`Admin`, `Operator`, `Reader`, or `Auditor`)

---

## 6. Troubleshooting

### 6.1 `401 Unauthorized` — audience mismatch

**Symptom:** API returns 401; logs show `IDX10214: Audience validation failed`.

**Cause:** The `aud` claim in the IdP-issued token does not match `ArchLucidAuth:Audience`.

**Fix (Auth0):**
1. In Auth0 Dashboard → **Applications → APIs → ArchLucid API**, check the **Identifier** field.
2. Ensure `ArchLucidAuth:Audience` matches exactly (case-sensitive).
3. Always include `audience=api://archlucid` in the authorization or token request. Auth0 issues **opaque tokens** (not JWTs) when no audience is specified — ArchLucid cannot validate opaque tokens.

**Fix (Okta):**
1. In Okta Admin Console → **Security → API → \<authorization server\>**, check the **Audience** field.
2. Ensure `ArchLucidAuth:Audience` matches exactly (case-sensitive).
3. If you changed the audience, request a new token — existing tokens carry the old `aud`.

### 6.2 `401 Unauthorized` — issuer mismatch

**Symptom:** API returns 401; logs show `IDX10205: Issuer validation failed` (Okta may also show a discovery-fetch failure).

**Cause (Auth0):** Auth0 issues tokens with `iss` = `https://<tenant>.auth0.com/` (trailing slash). If `ArchLucidAuth:Authority` omits the trailing slash, the JWT middleware downloads metadata successfully but the issuer claim comparison fails.

**Fix (Auth0):** Ensure `ArchLucidAuth:Authority` includes the trailing slash: `https://your-tenant.auth0.com/`.

**Cause (Okta):** `ArchLucidAuth:Authority` does not match the Okta authorization server's issuer, or the API host cannot reach Okta's OIDC metadata endpoint (DNS, firewall, proxy).

**Fix (Okta):**
1. Confirm the Authority URL matches the Okta issuer exactly. Common mistake: omitting `/oauth2/default` or using a custom authorization server id when you meant the default (or vice versa).
2. Test connectivity from the API host: `curl -s https://dev-123456.okta.com/oauth2/default/.well-known/openid-configuration | jq .issuer`.
3. If behind a corporate proxy, configure `HTTP_PROXY` / `HTTPS_PROXY` environment variables for the API process.

### 6.3 `403 Forbidden` — missing or incorrect `roles` claim

**Symptom:** Authentication succeeds (no 401), but protected endpoints return 403.

**Cause:** The JWT does not contain a `roles` claim, or the claim value does not match ArchLucid's expected role strings (`Admin`, `Operator`, `Reader`, `Auditor`).

**Fix (both providers):**
1. Decode the access token at [jwt.io](https://jwt.io) or with `jq -R 'split(".") | .[1] | @base64d | fromjson'` and inspect the `roles` claim.
2. Confirm the claim is case-sensitive-correct: `Admin`, `Operator`, `Reader`, `Auditor`.

**Fix (Auth0-specific):**
1. Verify the Auth0 Action (§2.3) is deployed and placed in the Login flow.
2. If the claim is namespaced (e.g. `https://archlucid.net/roles` instead of `roles`), update the Action to use a non-namespaced claim name, or contact ArchLucid support about `RoleClaimType` configuration.
3. For **M2M (client credentials)** tokens: Auth0 does not run the Login flow for client credentials grants. Use a separate **Machine to Machine** Action trigger (Credentials Exchange) or assign roles to the M2M application directly via the Auth0 Management API.

**Fix (Okta-specific):**
1. Verify the custom claim is configured on the Okta authorization server (§3.3) and is included in **access tokens** (not just ID tokens).
2. Confirm the user is assigned to the correct Okta group and the group is linked to the OIDC application.

### 6.4 `401 Unauthorized` — clock skew

**Symptom:** Tokens that appear valid in jwt.io are rejected; logs show `IDX10222: Lifetime validation failed. The token is expired` or `IDX10223: ... token is not yet valid`.

**Cause:** The system clock on the ArchLucid API host is out of sync with the IdP's token issuance server. The default `ClockSkew` in the JWT bearer pipeline is **5 minutes** (Microsoft default) or **2 minutes** for local-key configurations.

**Fix:**
1. Verify the API host clock: `date -u` (Linux) or `[DateTime]::UtcNow` (PowerShell).
2. Sync with NTP: `sudo ntpdate pool.ntp.org` or ensure the Windows Time service is running.
3. If the skew is persistent and greater than 5 minutes, investigate infrastructure clock drift.

### 6.5 `401 Unauthorized` — `MultiTenantEntra` left enabled

**Symptom:** All Auth0/Okta tokens rejected with `Issuer is not a valid Microsoft Entra ID v2.0 issuer`.

**Cause:** `ArchLucidAuth:MultiTenantEntra` is `true`. The `EntraMultiTenantJwtBearerConfigurator` installs a custom issuer validator that **only** accepts `https://login.microsoftonline.com/{tid}/v2.0` issuers.

**Fix:** Set `ArchLucidAuth:MultiTenantEntra` to `false` when using Auth0 or Okta.

### 6.6 Auth0 returns opaque tokens instead of JWTs

**Symptom:** The token from Auth0 is a short opaque string (not a three-part base64 JWT). ArchLucid rejects it immediately.

**Cause:** Auth0 returns opaque tokens when the token request does not include an `audience` parameter.

**Fix:** Always include `audience=api://archlucid` (matching your API Identifier) in the `/authorize` and `/oauth/token` requests. Auth0 only issues JWT access tokens when an audience is specified.

### 6.7 Okta token does not contain expected scopes or claims

**Symptom:** `GET /api/auth/me` returns a principal with no roles or unexpected name.

**Fix:**
1. In Okta, use the **Token Preview** tab on the authorization server to inspect what claims are emitted for a given user/application/grant type.
2. Ensure the `roles` claim is configured for **Access Token** (not ID Token only).
3. If using client credentials, ensure the claim expression handles the M2M case (client credentials tokens have no user context; group membership expressions may not resolve). Consider using a static claim or a different claim mapping for M2M clients.

---

## 7. Role and policy reference

| ArchLucid role | Authorization policy | Permissions granted |
|---------------|---------------------|---------------------|
| `Admin` | `AdminAuthority` | `commit:run`, `seed:results`, `export:consulting-docx`, `replay:comparisons`, `replay:diagnostics`, `metrics:read` |
| `Operator` | `ExecuteAuthority` | `commit:run`, `seed:results`, `export:consulting-docx`, `replay:comparisons`, `replay:diagnostics` |
| `Reader` | `ReadAuthority` | `metrics:read` |
| `Auditor` | `RequireAuditor` | `metrics:read` (plus audit export surfaces) |

**Source:** `ArchLucid.Api/Auth/Services/ArchLucidRoleClaimsTransformation.cs`, `ArchLucid.Core/Authorization/ArchLucidRoles.cs`, `ArchLucid.Core/Authorization/ArchLucidPolicies.cs`.

## Related

- **[SCIM provisioning](SCIM_PROVISIONING.md)** — automate user/group sync from Auth0 or Okta to ArchLucid (both support outbound SCIM via enterprise connections).
- **[GENERIC_OIDC_SETUP.md](../runbooks/GENERIC_OIDC_SETUP.md)** — cross-vendor OIDC sequence/troubleshooting for issuers other than Entra/Auth0/Okta (Keycloak, etc.), plus Entra JWT-bearer claim mapping.
- **[appsettings.Entra.sample.json](../../ArchLucid.Api/appsettings.Entra.sample.json)** — reference config for the primary Entra ID integration.
- **[docs/security/TRIAL_AUTH.md](../security/TRIAL_AUTH.md)** — trial-tier authentication (External ID + local identity).
- **[README.md § API authentication](../REPOSITORY_README.md#api-authentication-archlucidauth)** — summary of all auth modes.
