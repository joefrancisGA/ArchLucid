> **Scope:** Contributor-reference — Authoritative API authentication behavior contract for `ArchLucidAuth` — tested by `ArchLucid.Api.Tests/Auth/ApiAuthBehaviorContractTests.cs` and guarded by `scripts/ci/check_api_auth_doc_contract.py`.

# API authentication behavior contract

**Audience:** Operators, integrators, and security reviewers.

**Canonical configuration section:** `ArchLucidAuth` (mode) and `Authentication:ApiKey` (key material).

## Modes

| Mode | When used | Default authenticate scheme | Fail-closed behavior |
| --- | --- | --- | --- |
| **`ApiKey`** | Shipped `appsettings.json` base profile | `ApiKey` | When `Authentication:ApiKey:Enabled=false` and `DevelopmentBypassAll=false`, unauthenticated requests **fail closed** (401) — no synthetic admin principal. |
| **`DevelopmentBypass`** | `appsettings.Development.json` when `ASPNETCORE_ENVIRONMENT=Development` | `DevelopmentBypass` | Every request authenticates as `DevUserId` / `DevUserName` with `DevRole` (default Admin). **Blocked in Production** by configuration rules. |
| **`JwtBearer`** | Production-like samples and Entra/OIDC deployments | `Bearer` | Missing or invalid JWT **fail closed** (401/403). Authority/Audience or local PEM signing per configuration. |

## ApiKey details

- Header: **`X-Api-Key`**
- Enable: set `Authentication:ApiKey:Enabled` to true and supply non-placeholder values for **AdminKey** and/or **ReadOnlyKey** (see [Secret storage](#secret-storage) — never in git).
- **Admin key** maps to `Admin` role; **read-only key** maps to `Reader` role.
- `Authentication:ApiKey:DevelopmentBypassAll` may authenticate as synthetic admin **only in non-Production**; **never allowed in Production**.
- Expired keys (when `*ExpiresAt` set) fail authentication.

## DevelopmentBypass details

- Set `ArchLucidAuth:Mode` to **DevelopmentBypass** (Development host profile).
- Optional test headers when **Allow test actor headers** is enabled on `ArchLucidAuth` (**never in Production**).
- Does not bypass authorization policies — it only supplies a principal.

## Secret storage (key material)

**Never commit API key values** to git. Gitleaks and pre-receive hooks block them by design.

| Surface | Where to store values |
| --- | --- |
| **Local API** (`dotnet run`) | [User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) on `ArchLucid.Api` — e.g. `dotnet user-secrets set "Authentication:ApiKey:AdminKey" "<your-key>"` and `Authentication:ApiKey:Enabled` = true |
| **Local UI / Playwright** | `archlucid-ui/.env.local` (gitignored): `ARCHLUCID_API_KEY=<your-key>` — see `archlucid-ui/.env.example` |
| **Local CLI** | Environment `ARCHLUCID_API_KEY` or user-local `archlucid.json` (not tracked) |
| **GitHub Actions** | Repository secrets: `gh secret set LIVE_API_KEY` / `LIVE_API_KEY_READONLY` (wired in `.github/workflows/ci.yml` for live ApiKey E2E) |
| **Hosted / production** | Azure Key Vault or Container Apps secret refs — see [`CONFIGURATION_KEY_VAULT.md`](CONFIGURATION_KEY_VAULT.md) |

Shipped `appsettings*.json` keep `AdminKey` / `ReadOnlyKey` as **null**; docs and tests reference **key names** only.

## JwtBearer details

- Standard OIDC/JWKS when `ArchLucidAuth:Authority` / `Audience` configured.
- Local PEM validation when `ArchLucidAuth:JwtSigningPublicKeyPemPath` set (CI/integration tests).
- Role claim type: `roles` mapped to ArchLucid policies via `ArchLucidRoleClaimsTransformation`.

## Policy mapping

| Policy | Minimum role |
| --- | --- |
| `ReadAuthority` | Reader |
| `ExecuteAuthority` | Operator |
| `AdminAuthority` | Admin |

Debug principal surface: `GET /api/auth/me` (UI proxy).

## Cross-references

- Operator README: [`docs/REPOSITORY_README.md`](../REPOSITORY_README.md) § API authentication
- Configuration keys: [`docs/library/CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md)
- Handler tests: `ArchLucid.Api.Tests/ApiKeyAuthenticationHandlerTests.cs`, `ArchLucid.Api.Tests/Auth/ApiAuthBehaviorContractTests.cs`
- Production config lint: `ArchLucid.Host.Core.Startup.Validation.ArchLucidConfigurationRules`
