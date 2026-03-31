# Change Set 56R — release candidate hardening & pilot readiness

## Objective

Harden configuration, startup, logging/observability, packaging, and operator-facing readiness **without** broad feature work. Prefer explicit, production-grade C#; preserve deterministic behavior and policy controls.

## This change set (incremental)

### Prompt 1 — configuration surface & startup diagnostics

- **Startup snapshot:** One structured `Information` log after host build with **non-secret** effective flags. Toggle via **`Hosting:LogStartupConfigurationSummary`** (default `true` when unset).
- **Config alignment:** `appsettings.json` and Key Vault sample use **AdminKey** / **ReadOnlyKey**. Key Vault doc updated.

### Prompt 2 — configuration & environment validation (current)

- **API fail-fast:** `ArchiForgeConfigurationRules.CollectErrors` runs **immediately after** `WebApplication.Build()` and **before** schema bootstrap / DbUp. Any error → log each line and **`InvalidOperationException`** (process exit). Replaces the late **`IHostedService`** validator so misconfiguration is not masked in Development.
- **SQL vs InMemory:** `ConnectionStrings:ArchiForge` is **required** only when **`ArchiForge:StorageProvider`** is **Sql** (including default `Sql` when the section is absent). **InMemory** allows no SQL connection string.
- **Policy/schema files:** Validates **SchemaValidation** JSON schema paths are **relative**, stay **under** `AppContext.BaseDirectory`, and **exist on disk** at startup (matches `SchemaValidationService` load semantics).
- **CLI:** `ArchiForgeApiClient.GetInvalidApiBaseUrlReason` + constructor guard; `EnsureApiConnectedAsync` and **`health`** print stderr guidance for bad URLs.
- **UI:** `resolveUpstreamApiBaseUrlForProxy()` returns **503** JSON problem from `/api/proxy/*` when the upstream base URL is empty, malformed, or non-http(s).
- **Artifacts:** No separate on-disk artifact root in API config (exports are streams/DB-backed); **CLI** `archiforge run` already validates brief path and creates `outputs` from `archiforge.json` — unchanged.

### Prompt 3 — startup readiness checks

- **HTTP:** `GET /health/live` — process liveness only. `GET /health/ready` — database (skipped when `StorageProvider=InMemory`), JSON schema files, bundled compliance rule pack, writable temp directory. `GET /health` — all registered checks (live + ready).
- **CLI:** `archiforge doctor` or `archiforge check` — local project checks + calls the three endpoints and prints JSON (truncated) with clear section headers.
- **Tags:** `ArchiForge.Api.Health.ReadinessTags` (`live` / `ready`); no extra framework beyond `IHealthCheck`.

### Prompt 5 — packaging and local release scripts

- **Scripts (repo root):** `build-release`, `package-release`, `run-readiness-check` (`.cmd` + `.ps1`) — Release build, `dotnet publish` to `artifacts/release/api/`, optional Next.js production build when Node is available, RC-style gate (Release + fast core + Vitest).
- **Doc:** [RELEASE_LOCAL.md](RELEASE_LOCAL.md) — handoff workflow, run published API, UI dev/build, CI notes, scope limits (no SBOM/container in-script).

### Prompt 6 — pilot onboarding and operator docs

- **New:** [PILOT_GUIDE.md](PILOT_GUIDE.md) — what the product does, minimum setup, first run (Swagger + CLI), artifact review, readiness/core tests, logs vs DB artifacts, support hints.
- **New:** [OPERATOR_QUICKSTART.md](OPERATOR_QUICKSTART.md) — copy-paste command blocks only.
- **New:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — common failure modes, triage table, log search tokens, UI proxy notes.
- **Updated:** [README.md](../README.md) — pilot onboarding section + doc table rows.

### Prompt 7 — end-to-end release readiness smoke

- **New:** `release-smoke.ps1`, `release-smoke.cmd` — Release build, fast core (+ optional `-FullCore`), optional UI Vitest + `next build`, temporary **ArchiForge.Api** process, **`GET /health/ready`** + **`/health/live`**, CLI **`new` + `run --quick`**, assert **≥ 1** artifact via **`GET /api/artifacts/manifests/{goldenManifestId}`**.
- **New:** [RELEASE_SMOKE.md](RELEASE_SMOKE.md) — prerequisites, env vars, switches, relation to `run-readiness-check` / `package-release`.

### Prompt 8 — error presentation and supportability

- **API:** `ProblemSupportHints` adds optional **`extensions.supportHint`** on problem+json for known `ProblemTypes` (controllers + `ApplicationProblemMapper` + global 500 handler).
- **CLI:** `CliOperatorHints` — stderr **`Next:`** lines after API failures, health unreachable, readiness failure, brief/manifest/run issues; `ArchiForgeApiClient` records **HTTP status** on failed commit/submit/seed responses for hint selection.
- **UI:** Proxy returns **502** with **`supportHint`** when fetch to the C# API fails; **503** config errors include **`supportHint`** for `.env.local`.
- **Docs:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — `supportHint` / CLI `Next:` / UI proxy errors.

### Prompt 9 — focused tests for 56R hardening

- **API:** `ProblemSupportHintsTests`, extended **`ArchiForgeConfigurationRulesTests`** (storage/mode/Azure/schema paths), **`ApiProblemDetailsExceptionFilterTests`** assert **`supportHint`** on mapped problems.
- **CLI:** `InternalsVisibleTo` for **`ArchiForge.Cli.Tests`**; **`CliOperatorHintsTests`**; **`ArchiForgeApiClientHttpTests`** — commit failure preserves **HTTP status code**.

### Prompt 10 — release-candidate coherence (final pass)

- **Docs:** README **`ArchiForgeAuth`** table aligned with **`ApiKey`** mode; pilot guide uses **`dotnet run --project ArchiForge.Cli`** consistently with scripts; **RELEASE_SMOKE** CMD/`;` caveat.
- **Logging:** Single startup **configuration snapshot** log now includes **`ContentRoot`**; removed redundant “host built” **Information** line before validation.

### Deferred to later prompts (56R backlog)

- Structured log enrichers, version/commit in logs, OTLP defaults.
- Structured logging enrichers (version, deployment slot) and log level profiles per environment.
- Packaging: Dockerfile polish, version stamping, optional SBOM.
- **Design-partner readiness workflow:** checklist doc, support bundle export, or operator runbook (pick one minimal slice per prompt).

## Release candidate verdict (Prompt 10)

- **Adds (56R overall):** Fail-fast config validation before DbUp; `/health/live` + `/health/ready` + tagged checks; startup **non-secret** configuration snapshot (toggle `Hosting:LogStartupConfigurationSummary`); local **build/package/readiness/smoke** scripts; pilot/operator/troubleshooting docs; API **`supportHint`**, CLI **`Next:`** hints, UI proxy **502/503** hints; focused unit tests for rules, hints, and CLI behavior.
- **Deliberately not in 56R:** Self-contained RID publish in scripts, SBOM/signing/container polish, OTLP/log-enricher profiles, support-bundle export, Playwright in `release-smoke`, full multi-tenant/perf matrices.
- **Pilot readiness:** **Yes** for a first design-partner run **if** they have .NET 10, a working SQL (or explicit **InMemory** dev path), and follow **PILOT_GUIDE** / **OPERATOR_QUICKSTART**. Recommend **`run-readiness-check`** before handoff and **`release-smoke`** (with **`ARCHIFORGE_SMOKE_SQL`**) when SQL and port **5128** are available.
- **Small follow-ups before “commercial” hardening:** optional design-partner checklist doc; visible API window or log capture flag for failed **`release-smoke`** E2E; self-contained publish recipe if pilots lack SDK.

## Related files

- `ArchiForge.Api/Startup/Diagnostics/*`
- `ArchiForge.Api/Startup/Validation/ArchiForgeConfigurationRules.cs`
- `ArchiForge.Api/Program.cs`
- `ArchiForge.Api/appsettings.json`, `appsettings.KeyVault.sample.json`
- `ArchiForge.Cli/ArchiForgeApiClient.cs`, `ArchiForge.Cli/Program.cs`, `ArchiForge.Cli/DoctorCommand.cs`
- `ArchiForge.Api/Health/*` (readiness tags, schema/compliance/temp checks, SQL check behavior)
- `ArchiForge.Api/Startup/PipelineExtensions.cs` (`/health/live`, `/health/ready`)
- `archiforge-ui/src/lib/config.ts`, `archiforge-ui/src/app/api/proxy/[...path]/route.ts`
- `docs/CONFIGURATION_KEY_VAULT.md`
- `build-release.cmd`, `build-release.ps1`, `package-release.cmd`, `package-release.ps1`, `run-readiness-check.cmd`, `run-readiness-check.ps1`
- `docs/RELEASE_LOCAL.md`
- `docs/PILOT_GUIDE.md`, `docs/OPERATOR_QUICKSTART.md`, `docs/TROUBLESHOOTING.md`
- `release-smoke.ps1`, `release-smoke.cmd`, `docs/RELEASE_SMOKE.md`
- `ArchiForge.Api/ProblemDetails/ProblemSupportHints.cs`, `ArchiForge.Api/ProblemDetails/*` (extensions wiring), `ArchiForge.Api/Startup/PipelineExtensions.cs`
- `ArchiForge.Cli/CliOperatorHints.cs`, `ArchiForge.Cli/ArchiForgeApiClient.cs`, `ArchiForge.Cli/Program.cs`, `ArchiForge.Cli/DoctorCommand.cs`
- `archiforge-ui/src/app/api/proxy/[...path]/route.ts`, `docs/TROUBLESHOOTING.md`, `docs/API_CONTRACTS.md` (problem extensions)
