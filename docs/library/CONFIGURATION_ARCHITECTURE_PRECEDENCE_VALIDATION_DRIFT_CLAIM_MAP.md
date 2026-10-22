> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Configuration architecture — precedence, validation, drift

**Audience:** Engineering, security reviewers, principal-architect diligence. Not a buyer brochure.

**Status:** **Done** (**TB-1561**, 2026-08-10). GTM **M-290** / **M-291**. Pair honesty CI **TB-1562** / **M-290**.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#configuration-architecture-precedence-validation-drift-m-291`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#configuration-architecture-precedence-validation-drift-m-291) (GTM **M-291**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) (GTM **M-290**).

**Verdict (one line):** Config is a **layered `IConfiguration` composition** (appsettings → Advanced/SaaS overlays → **env wins** → in-memory bridges); fail-fast via `ArchLucidConfigurationRules` + selective `ValidateOnStart`, not universal binding coverage; drift detection is **fragmented** (static TF preflight + SQL MigrateVerify — **no** live cross-env config parity SoT). The RC “registration env-var race” (**TB-881 Done**) was a **CI process-env / parallel-test** defect, not a production precedence race or pilot ship gate.

---

## 1. RC registration “env-var race” (classify correctly)

| ID | Status | Class |
|----|--------|-------|
| **TB-881** | **Done** | CI/test: process-wide env pins raced under parallel xUnit → wrong ephemeral catalog |
| **TB-1371** / **TB-1372** | Open | Ship-blocker **classification** honesty (do not reopen as pilot gate) |
| Residual signup TOCTOU | Product residual | Concurrent same-name signup stress — not V1 pilot sequential path |

**Forbid:** “Open RC env-var race blocks pilots” / equating TB-881 with production registration corruption.

---

## 2. Precedence (actual API host)

| Order | Layer |
|-------|-------|
| 1 | `WebApplication.CreateBuilder` defaults (base JSON → env JSON → user-secrets → env → args) |
| 2 | `appsettings.Pilot.json` (optional pilot overlay — connection strings + scale-honest defaults) |
| 3 | `appsettings.Advanced.json` / `appsettings.SaaS.json` (optional feature-grouped overlays) |
| 4 | Explicit `AddEnvironmentVariables()` again → **env beats Pilot/Advanced/SaaS** |
| 5 | In-memory bridges (`AzureOpenAiEnvironmentConfigurationBridge`, etc.) when nested unset |
| 6 | Platform CA Key Vault references → appear as env/settings before process |

Documented per-key sources (`CONFIGURATION_REFERENCE.md`) do **not** replace this ladder. Terraform injects CA env/secrets — it does **not** apply appsettings as SoT.

---

## 3. Startup validation vs runtime reads

| Fail-fast (startup) | Deferred / runtime |
|---------------------|--------------------|
| `ArchLucidConfigurationRules.CollectErrors` before DbUp | `IOptionsMonitor<T>` dominant |
| Production dangerous misconfig lint (fold-in) | FeatureManagement / `IFeatureFlags` |
| Selective `ValidateOnStart` + `IValidateOptions<T>` | No Azure App Configuration sentinel (ADR 0017) → most knobs restart-bound |
| Auth bypass guard at DI | `ConfigurationHealthProbe` = connectivity, not expected-vs-actual matrix |
| CLI `config lint --profile production-like-hosted-pilot` | Support-bundle redacted snapshot = audit aid, not drift SoT |

**Safe pin:** Strong for **dangerous/production-like** keys; not a claim that every option is validated on start.

---

## 4. Environment drift detection

| Exists | Does **not** exist |
|--------|---------------------|
| Static TF/CD preflight (`Assert-TerraformDeploymentDriftPreflight`) | Live expected-vs-actual **config** health across Staging/Prod |
| SQL schema MigrateVerify sentinels (TB-065) | Automated per-env appsettings/env parity suite |
| Catalog ↔ lint key parity tests | Merge-gated continuous `terraform plan` live compare |
| `IAC_RUNTIME_PARITY.md` (advisory mapping) | Azure App Configuration revision SoT (deferred) |
| CA `ignore_changes` escape docs (**TB-1317**) | “TF state alone = CA runtime SoT” (forbidden — **TB-1318**) |

---

## 5. Machines (do not conflate)

| Machine | Meaning |
|---------|---------|
| **A — Host precedence** | CreateBuilder → Advanced/SaaS → env → bridges |
| **B — Secret planes** | Platform KV references → env; app `ISecretProvider` for integration secrets |
| **C — Fail-fast** | Rules + selective ValidateOnStart before/around host start |
| **D — Runtime read** | IOptionsMonitor / flags; restart-bound without App Config |
| **E — Drift classes** | Static TF preflight; schema MigrateVerify; CA escape; **no** live config parity |
| **F — TB-881 class** | CI process-env race Done ≠ pilot registration failure ≠ signup TOCTOU |

---

## 6. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Open RC registration env-var race blocks pilots” | TB-881 **Done**; CI isolation; pilots sequential |
| “appsettings.json is deployment SoT” | Env (and CA-injected secrets) win after overlays |
| “Terraform state is CA config SoT” | Ownership splits + `ignore_changes`; KV values not in state |
| “Drift preflight proves live Azure matches TF” | Static wiring only |
| “Startup validation covers all config” | Rules + selected ValidateOnStart; many keys unbound |
| “IOptionsMonitor means hot-reload in prod” | No App Config sentinel (ADR 0017) |
| “ConfigurationHealthProbe / MigrateVerify prove env config parity” | Connectivity / SQL schema only |

---

## 7. Related owners

| ID | Role |
|----|------|
| Done **TB-881** | CI env-pin race closed |
| Open **TB-1371** / **M-249** | Classification honesty |
| Open **TB-1317** / **M-233** | CA Terraform drift escapes |
| Done **TB-734**; open **TB-1326**–**TB-1330** | Config reference help UX |
| ADR **0017** | App Config deferred |
| Done **TB-1561** / **M-290** / **M-291** | This configuration-architecture claim map |
| Done **TB-1562** / **M-290** | Honesty CI for overclaim classes in §6 |

---

## CI anchors for **TB-1562**

| Anchor | Role |
| --- | --- |
| `scripts/ci/check_configuration_architecture_precedence_honesty.py` | Fail appsettings/TF-state SoT, drift-preflight parity, universal startup validation, IOptionsMonitor hot-reload, and TB-881 pilot-gate overclaims |
| `CONFIGURATION_ARCHITECTURE_PRECEDENCE_VALIDATION_DRIFT_CLAIM_MAP.md` | Drift guard (this file) |
| `ArchLucidConfigurationRules` | Selective fail-fast validation |
| `Assert-TerraformDeploymentDriftPreflight.ps1` | Static TF wiring preflight only |
| Coordinate **TB-1372** / **TB-1318** | TB-881 pilot-gate and CA TF-state honesty |

Honesty CI shipped: **TB-1562**.

---

## 8. Optional follow-ons (not required to close honesty pin)

1. Author a single precedence-ladder section in `CONFIGURATION_REFERENCE.md` matching `Program.cs`.  
2. Expand `ValidateOnStart` coverage for remaining high-risk options.  
3. Live config expected-vs-actual probe (product gap — do not sell as shipped).  
4. Unique `Tenants.Name` index if signup-stress concurrency becomes a pilot concern.
