# Configuration bridge (ArchLucid over ArchiForge) — sunset plan

## 1. Objective

Document **why** legacy `ArchiForge*` configuration keys still work, **what** overrides them, and **when** to delete the bridge without breaking deployed environments.

## 2. Assumptions

- Rename proceeds in **phases** (`docs/ARCHLUCID_RENAME_CHECKLIST.md`); Phase 7 removes bridges **after** environments adopt new keys.

## 3. Constraints

- **Never** remove fallbacks in the same change as an unrelated feature without an explicit migration note.
- **OIDC storage keys** and **environment variables** follow the same pattern: read new name first, then legacy (see checklist Phase 2.6 / 7.2).

## 4. Architecture overview

**Nodes:** `IConfiguration` providers (appsettings, env vars, Key Vault).  
**Edges:** `ArchiForgeConfigurationBridge` and `ArchiForgeAuthConfigurationBridge` merge **ArchLucid** sections over **ArchiForge** before startup gates and early DI branches.

## 5. Component breakdown

| Bridge | Location | Behavior |
|--------|----------|----------|
| Storage + general options | `ArchiForgeConfigurationBridge.ResolveArchiForgeOptions` | Binds `ArchiForge` section, then applies `ArchLucid:StorageProvider` if set. |
| Auth | `ArchiForgeAuthConfigurationBridge.Resolve` + `PostConfigure<ArchiForgeAuthOptions>` | Binds `ArchiForgeAuth`, then binds `ArchLucidAuth` **over** when that section exists. |
| Auth scalar reads | `ResolveAuthConfigurationValue` | Used by validation rules for production auth checks. |

**Call sites** that previously used `GetSection(ArchiForgeOptions.SectionName).Get<ArchiForgeOptions>()` for **early branching** now use **`ResolveArchiForgeOptions`** so behavior matches **`IOptions`** + PostConfigure.

## 6. Data flow

Configuration load → bridge merge → `ArchiForgeOptions` / `ArchiForgeAuthOptions` → DI and `Program.cs` guards.

## 7. Security model

- Misconfiguration (e.g. production + development bypass) is blocked in validation (`ArchiForgeConfigurationRules`) using **resolved** auth values so **ArchLucidAuth** cannot be accidentally ignored.

## 8. Operational considerations

- **Sunset:** checklist **Phase 7.1–7.3** — remove `ArchiForge*` keys and env fallbacks after telemetry shows no legacy usage in target environments.
- **UI:** proxy prefers **`ARCHLUCID_API_KEY`**, falls back to **`ARCHIFORGE_API_KEY`** (`archiforge-ui/.env.example`).
