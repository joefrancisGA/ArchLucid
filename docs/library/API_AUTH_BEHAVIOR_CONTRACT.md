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
- Enable: `Authentication:ApiKey:Enabled=true` plus non-placeholder `AdminKey` and/or `ReadOnlyKey`.
- **Admin key** maps to `Admin` role; **read-only key** maps to `Reader` role.
- `Authentication:ApiKey:DevelopmentBypassAll=true` may authenticate as synthetic admin **only in non-Production**; **never allowed in Production**.
- Expired keys (when `*ExpiresAt` set) fail authentication.

## DevelopmentBypass details

- Configured via `ArchLucidAuth:Mode=DevelopmentBypass`.
- Optional test headers when `ArchLucidAuth:AllowTestActorHeaders=true` (**never in Production**).
- Does not bypass authorization policies — it only supplies a principal.

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
