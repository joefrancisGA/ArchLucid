> **Reviewed:** 2026-07-22
> **Scope:** Archived implementation log — Change Sets **55R** through **59R** (immutable historical record). Do not edit bodies; see [README.md](README.md).

# Change Set series 55R–59R (consolidated)

Incremental prompt logs for operator shell coherence (55R), release-candidate hardening (56R), Playwright operator journeys (57R), product-learning dashboard (58R), and learning-to-planning bridge (59R). Supersedes the per-set files formerly named `CHANGE_SET_55R_SUMMARY.md` through `CHANGE_SET_59R.md`.

---
## 55R — operator shell coherence

## What 55R adds

- **Operator shell coherence:** Shared navigation, breadcrumbs, and operator messaging patterns across home, runs, run/manifest detail, graph, compare, replay, and artifact review.
- **Deterministic artifact review:** Canonical manifest-scoped artifact URLs; run-scoped `/runs/{runId}/artifacts/{artifactId}` resolves manifest then redirects; artifact lists and bundle behavior aligned with API (empty list vs bundle 404).
- **Compare / review clarity:** Sequential legacy-then-structured fetches on **Compare**; UI explains **fetch order** vs **on-page review order** (structured first, then legacy); optional AI explanation on a separate action; stale-input warning when run IDs drift from any shown results (including AI); “Last compare request” documents structured + legacy outcomes and notes AI is separate.
- **Guards and tests:** Coercion/guards for operator-facing JSON; Vitest smoke coverage for API wiring (list/descriptor/compare/explain), shell nav, and key review components.

## What 55R deliberately does not do

- **Not** a full product UI redesign, workflow engine, or write/edit surface for manifests and runs beyond read-focused inspection.
- **Not** exhaustive E2E/browser automation; coverage is unit and targeted component smoke.
- **Not** new comparison algorithms or backend domain features beyond wiring and contract alignment already in scope for the shell.

## Suggested next v1 hardening step

- **One Playwright (or equivalent) smoke path** per load-bearing journey: run detail → artifact review → back; compare with prefilled query params → assert structured + legacy sections and stale warning when IDs change; manifest empty list adjacent to bundle 404 handling. This catches regressions in routing, proxy, and layout that unit tests miss.

---

## 56R — release candidate hardening and pilot readiness

## Objective

Harden configuration, startup, logging/observability, packaging, and operator-facing readiness **without** broad feature work. Prefer explicit, production-grade C#; preserve deterministic behavior and policy controls.

## This change set (incremental)

### Prompt 1 — configuration surface & startup diagnostics

- **Startup snapshot:** One structured `Information` log after host build with **non-secret** effective flags. Toggle via **`Hosting:LogStartupConfigurationSummary`** (default `true` when unset).
- **Config alignment:** `appsettings.json` and Key Vault sample use **AdminKey** / **ReadOnlyKey**. Key Vault doc updated.

### Prompt 2 — configuration & environment validation (current)

- **API fail-fast:** `ArchLucidConfigurationRules.CollectErrors` runs **immediately after** `WebApplication.Build()` and **before** schema bootstrap / DbUp. Any error → log each line and **`InvalidOperationException`** (process exit). Replaces the late **`IHostedService`** validator so misconfiguration is not masked in Development.
- **SQL vs InMemory:** `ConnectionStrings:ArchLucid` is **required** only when **`ArchLucid:StorageProvider`** is **Sql** (including default `Sql` when the section is absent). **InMemory** allows no SQL connection string.
- **Policy/schema files:** Validates **SchemaValidation** JSON schema paths are **relative**, stay **under** `AppContext.BaseDirectory`, and **exist on disk** at startup (matches `SchemaValidationService` load semantics).
- **CLI:** `ArchLucidApiClient.GetInvalidApiBaseUrlReason` + constructor guard; `EnsureApiConnectedAsync` and **`health`** print stderr guidance for bad URLs.
- **UI:** `resolveUpstreamApiBaseUrlForProxy()` returns **503** JSON problem from `/api/proxy/*` when the upstream base URL is empty, malformed, or non-http(s).
- **Artifacts:** No separate on-disk artifact root in API config (exports are streams/DB-backed); **CLI** `archlucid run` already validates brief path and creates `outputs` from `archlucid.json` — unchanged.

### Prompt 3 — startup readiness checks

- **HTTP:** `GET /health/live` — process liveness only. `GET /health/ready` — database (skipped when `StorageProvider=InMemory`), JSON schema files, bundled compliance rule pack, writable temp directory. `GET /health` — all registered checks (live + ready).
- **CLI:** `archlucid doctor` or `archlucid check` — local project checks + calls the three endpoints and prints JSON (truncated) with clear section headers.
- **Tags:** `ArchLucid.Api.Health.ReadinessTags` (`live` / `ready`); no extra framework beyond `IHealthCheck`.

### Prompt 5 — packaging and local release scripts

- **Scripts (repo root):** `build-release`, `package-release`, `run-readiness-check` (`.cmd` + `.ps1`) — Release build, `dotnet publish` to `artifacts/release/api/`, optional Next.js production build when Node is available, RC-style gate (Release + fast core + Vitest).
- **Doc:** [RELEASE_LOCAL.md](RELEASE_LOCAL.md) — handoff workflow, run published API, UI dev/build, CI notes, scope limits (no SBOM/container in-script).

### Prompt 6 — pilot onboarding and operator docs

- **New:** [PILOT_GUIDE.md](PILOT_GUIDE.md) — what the product does, minimum setup, first run (Swagger + CLI), artifact review, readiness/core tests, logs vs DB artifacts, support hints.
- **New:** [OPERATOR_QUICKSTART.md](OPERATOR_QUICKSTART.md) — copy-paste command blocks only.
- **New:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — common failure modes, triage table, log search tokens, UI proxy notes.
- **Updated:** [README.md](../REPOSITORY_README.md) — pilot onboarding section + doc table rows.

### Prompt 7 — end-to-end release readiness smoke

- **New:** `release-smoke.ps1`, `release-smoke.cmd` — Release build, fast core (+ optional `-FullCore`), optional UI Vitest + `next build`, temporary **ArchLucid.Api** process, **`GET /health/ready`** + **`/health/live`**, CLI **`new` + `run --quick`**, assert **≥ 1** artifact via **`GET /api/artifacts/manifests/{goldenManifestId}`**.
- **New:** [RELEASE_SMOKE.md](RELEASE_SMOKE.md) — prerequisites, env vars, switches, relation to `run-readiness-check` / `package-release`.

### Prompt 8 — error presentation and supportability

- **API:** `ProblemSupportHints` adds optional **`extensions.supportHint`** on problem+json for known `ProblemTypes` (controllers + `ApplicationProblemMapper` + global 500 handler).
- **CLI:** `CliOperatorHints` — stderr **`Next:`** lines after API failures, health unreachable, readiness failure, brief/manifest/run issues; `ArchLucidApiClient` records **HTTP status** on failed commit/submit/seed responses for hint selection.
- **UI:** Proxy returns **502** with **`supportHint`** when fetch to the C# API fails; **503** config errors include **`supportHint`** for `.env.local`.
- **Docs:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — `supportHint` / CLI `Next:` / UI proxy errors.

### Prompt 9 — focused tests for 56R hardening

- **API:** `ProblemSupportHintsTests`, extended **`ArchLucidConfigurationRulesTests`** (storage/mode/Azure/schema paths), **`ApiProblemDetailsExceptionFilterTests`** assert **`supportHint`** on mapped problems.
- **CLI:** `InternalsVisibleTo` for **`ArchLucid.Cli.Tests`**; **`CliOperatorHintsTests`**; **`ArchLucidApiClientHttpTests`** — commit failure preserves **HTTP status code**.

### Prompt 10 — release-candidate coherence (final pass)

- **Docs:** README **`ArchLucidAuth`** table aligned with **`ApiKey`** mode; pilot guide uses **`dotnet run --project ArchLucid.Cli`** consistently with scripts; **RELEASE_SMOKE** CMD/`;` caveat.
- **Logging:** Single startup **configuration snapshot** log now includes **`ContentRoot`**; removed redundant “host built” **Information** line before validation.

### Deferred to later prompts (56R backlog)

- Structured log enrichers (deployment slot) and log level profiles per environment; OTLP defaults beyond current wiring.
- Packaging: Dockerfile polish, optional SBOM/signing, self-contained RID publish recipes in scripts.
- **Further design-partner workflow:** API-hosted support bundle, dedicated checklist doc beyond pilot guide — pick per later prompt.

## Release candidate verdict (Prompt 10 — original scope)

- **Adds (56R overall):** Fail-fast config validation before DbUp; `/health/live` + `/health/ready` + tagged checks; startup **non-secret** configuration snapshot (toggle `Hosting:LogStartupConfigurationSummary`); local **build/package/readiness/smoke** scripts; pilot/operator/troubleshooting docs; API **`supportHint`**, CLI **`Next:`** hints, UI proxy **502/503** hints; focused unit tests for rules, hints, and CLI behavior.
- **Deliberately not in original 56R:** Self-contained RID publish in scripts, SBOM/signing/container polish, rich OTLP/log-enricher profiles, Playwright in default `release-smoke`, full multi-tenant/perf matrices. (**Regenerated 56R** later added CLI **`support-bundle`**, **`GET /version`**, enriched health JSON, packaging **`metadata.json`**, and optional **`-RunPlaywright`** — see **Regenerated 56R** sections below.)
- **Pilot readiness:** **Yes** for a first design-partner run **if** they have .NET 10, a working SQL (or explicit **InMemory** dev path), and follow **PILOT_GUIDE** / **OPERATOR_QUICKSTART**. Recommend **`run-readiness-check`** before handoff and **`release-smoke`** (with **`ARCHIFORGE_SMOKE_SQL`**) when SQL and port **5128** are available.
- **Small follow-ups before “commercial” hardening:** optional design-partner checklist doc; visible API window or log capture flag for failed **`release-smoke`** E2E; self-contained publish recipe if pilots lack SDK.

## Regenerated 56R — incremental closing gaps

### Prompt 1 (regen) — build / version provenance

- **Core:** `ArchLucid.Core.Diagnostics.BuildProvenance` — single resolver for informational, assembly, and file version + runtime framework description.
- **API:** Startup `Pilot/support configuration snapshot` log extended with build fields; Serilog enricher adds `AssemblyFileVersion` when present; OpenTelemetry `service.version` uses informational version (matches logs).
- **Tests:** `BuildProvenanceTests`, extended `StartupConfigurationFactsReaderTests`.
- **Docs:** `docs/OPERATOR_QUICKSTART.md` — where to find provenance in logs; optional `/p:InformationalVersion` for CI.

### Prompt 2 (regen) — build/version/commit provenance HTTP surface, CLI, health, and release metadata

- **Core:** `BuildProvenance` extended with `CommitSha` — parsed from the `+{sha}` suffix of `AssemblyInformationalVersion` (populated automatically when `SourceRevisionId` is set at build time).
- **Core:** `BuildInfoResponse` DTO — lightweight, non-secret build identity payload for HTTP and CLI consumption.
- **API:** `GET /version` endpoint (`VersionController`, `[AllowAnonymous]`) — returns `application`, `informationalVersion`, `assemblyVersion`, `fileVersion`, `commitSha`, `runtimeFramework`, `environment`.
- **API:** `/health/ready` and `/health` now use `DetailedHealthCheckResponseWriter` — enriched JSON with per-check `name`, `status`, `durationMs`, `description`, `error`, plus top-level `version`, `commitSha`, and `totalDurationMs`. `/health/live` stays minimal for orchestrator probes.
- **CI:** Both `dotnet-fast-core` and `dotnet-full-regression` build steps now pass `/p:SourceRevisionId=$(git rev-parse HEAD)` so the commit SHA is embedded in the informational version automatically.
- **CLI:** `doctor` now prints a **CLI build info** section (version, assembly, runtime) and calls **`GET /version`** to display the API's build identity before running health probes.
- **CLI:** `ArchLucidApiClient.GetVersionJsonAsync` — new method for retrieving `/version` JSON.
- **Release:** `package-release.ps1` / `.cmd` now emit `artifacts/release/metadata.json` with `application`, `informationalVersion`, `commitSha`, `buildTimestampUtc`, `dotnetSdkVersion`, `packagerHost`.
- **Tests:** `BuildProvenanceTests` — `ParseCommitSha` theory tests, `BuildInfoResponse.FromProvenance` mapping/null tests. `VersionControllerTests` — controller returns expected fields and JSON shape. `DetailedHealthCheckResponseWriterTests` — healthy/unhealthy reports produce correct JSON payload.
- **Docs:** `OPERATOR_QUICKSTART.md` updated with `/version`, `/health/ready` enrichment, `SourceRevisionId` guidance. `CLI_USAGE.md` — `doctor` description updated.

### Prompt 3 (regen) — CLI support bundle export

- **CLI:** `archlucid support-bundle` — writes a UTC-stamped folder (default `support-bundle-<yyyyMMdd-HHmmss>Z`) with explicit JSON sections; **`--output <dir>`** and **`--zip`** supported.
- **Modules (reviewable):** `SupportBundleRedactor`, `SupportBundleCollector`, `SupportBundleArchiveWriter`, `SupportBundleCommand`, and one file per bundle DTO under `ArchLucid.Cli/Support/`.
- **Contents:** `manifest.json`, `build.json` (CLI build + raw `GET /version` JSON), `health.json` (`/health/live`, `/health/ready`, `/health` with truncated bodies), `config-summary.json` (non-secret `archlucid.json` fields + redacted API base URL), `environment.json` (machine/OS/runtime + filtered env: `ARCHIFORGE_*` / `DOTNET_*` only; secrets as `(set)`; SQL-related ArchLucid keys never show values; `ARCHIFORGE_API_URL` userinfo stripped), `workspace.json` (outputs dir file count/size + sample names), `references.json` (endpoint/doc hints), `logs.json` (guidance + optional small `outputs/last-run.log` excerpt).
- **Tests:** `ArchLucid.Cli.Tests/SupportBundleTests.cs` — redactor, mock HTTP collect, directory and zip writers.
- **Docs:** `CLI_USAGE.md`, `TROUBLESHOOTING.md`.

### Prompt 4 (regen) — readiness and smoke diagnostics for failure triage

- **Shared:** `scripts/OperatorDiagnostics.ps1` — phase headers, **`--- FAILURE (triage) ---`** blocks (**Stage**, **Category**, **Next:** hints), HTTP probe helper, readiness JSON parser (**first unhealthy check** among `entries[]`, then others sorted by **name** for deterministic output).
- **`run-readiness-check.ps1`:** Numbered phases (`[1/n]`…`[3/n]` when UI runs); triage on build, fast core, `npm ci`, Vitest failures; dynamic `n` when UI skipped or Node missing.
- **`release-smoke.ps1`:** Triage on each gate (build, core, optional full core, UI, SQL misconfig, API start/early exit, readiness **timeout** + post-timeout `/health/ready` + `/health` snapshot, liveness, CLI `new` / `run --quick`, artifacts API, Playwright); readiness wait uses **`Get-ArchLucidHttpProbe`** (captures non-200 bodies without throwing away JSON).
- **Docs:** [RELEASE_SMOKE.md](RELEASE_SMOKE.md) — “Failure triage (script output)”; [RELEASE_LOCAL.md](RELEASE_LOCAL.md) — readiness script triage note.

**Still for later regen prompts:** further pilot supportability (e.g. API-hosted bundle).

### Prompt 5 (regen) — release packaging metadata and handoff artifacts

- **`scripts/Write-ReleasePackageArtifacts.ps1`** — single writer invoked from **`package-release.ps1`** / **`package-release.cmd`** after publish (and optional UI build).
- **`metadata.json`** (extended): `schemaVersion` **1.1**, `packageKind`, `assemblyVersion`, `fileVersion` (Win32 file info), `apiPublishPathRelative`, `uiProductionBuildIncluded`; retains informational version, commit, UTC timestamp, SDK, packager host.
- **`release-manifest.json`**: `packageKind` **ArchLucid.ReleaseHandoff**, summary counts/bytes, full **`apiPublishFiles`** list with sizes, operator UI note, `companionFiles`, `checksumsSha256Generated`.
- **`checksums-sha256.txt`**: SHA-256 per file under `api/` (deterministic path order aligned with manifest); optional **`-SkipChecksums`** on **`.ps1`** only.
- **`PACKAGE-HANDOFF.txt`**: concise pilot-facing blurb and pointers to docs.
- **`docs/RELEASE_LOCAL.md`** — handoff table and **`-SkipChecksums`** note.

### Prompt 6 (regen) — docs for supportability and handoff

- **PILOT_GUIDE.md** — `GET /version`, **`doctor`**, readiness/smoke table, **support bundle** commands, **When you report an issue** checklist.
- **TROUBLESHOOTING.md** — **First-line steps** (health, version, doctor, bundle, readiness/smoke); expanded support bundle (`--output`, contents); link to pilot reporting section.
- **RELEASE_LOCAL.md** — **Support-friendly handoff** (`metadata.json` vs `/version`, bundle + doc pointers).
- **RELEASE_SMOKE.md** — Pilot note: readiness vs smoke, what to paste from triage output.
- **README.md** — Pilot onboarding tightened: version, doctor, support-bundle, reporting anchor.

### Prompt 8 (regen) — final coherence pass (supportability only)

- **Startup log:** `Pilot/support configuration snapshot` now includes **`BuildCommitSha`** (or **`(not stamped)`**), aligned with **`GET /version`** / enriched **`/health/ready`** `commitSha`.
- **Health JSON:** Inline comment in `DetailedHealthCheckResponseWriter` documents that **`version`** matches **`GET /version`** `informationalVersion`.
- **CLI:** `doctor` success line and class summary mention combined **`/health`**; **`Next:`** after readiness failure mentions **`GET /version`** for tickets.
- **Docs:** `CHANGE_SET_56R.md` verdict no longer contradicts regen deliverables; `OPERATOR_QUICKSTART` / `TROUBLESHOOTING` clarify `version` vs `informationalVersion`, optional JSON pretty-print, and **`.\release-smoke.ps1 -SkipE2E`**; `CLI_USAGE` doctor exit criteria clarified.
- **Tests:** `CliOperatorHintsTests` asserts readiness hint includes **`/version`**.

---

## Related files

- `ArchLucid.Core/Diagnostics/BuildProvenance.cs`, `ArchLucid.Core/Diagnostics/BuildInfoResponse.cs`
- `ArchLucid.Api/Controllers/VersionController.cs`
- `ArchLucid.Api/Health/DetailedHealthCheckResponseWriter.cs`
- `ArchLucid.Api/Startup/Diagnostics/*`
- `ArchLucid.Api/Startup/Validation/ArchLucidConfigurationRules.cs`
- `ArchLucid.Api/Startup/PipelineExtensions.cs` (`/health/live`, `/health/ready`, `/health`)
- `ArchLucid.Api/Program.cs`
- `ArchLucid.Api/appsettings.json`, `appsettings.KeyVault.sample.json`
- `ArchLucid.Cli/ArchLucidApiClient.cs`, `ArchLucid.Cli/Program.cs`, `ArchLucid.Cli/DoctorCommand.cs`, `ArchLucid.Cli/Support/*` (support bundle)
- `ArchLucid.Api/Health/*` (readiness tags, schema/compliance/temp checks, SQL check behavior)
- `archlucid-ui/src/lib/config.ts`, `archlucid-ui/src/app/api/proxy/[...path]/route.ts`
- `docs/CONFIGURATION_KEY_VAULT.md`
- `scripts/OperatorDiagnostics.ps1`, `scripts/Write-ReleasePackageArtifacts.ps1`, `build-release.cmd`, `build-release.ps1`, `package-release.cmd`, `package-release.ps1`, `run-readiness-check.cmd`, `run-readiness-check.ps1`
- `docs/RELEASE_LOCAL.md`
- `docs/PILOT_GUIDE.md`, `docs/OPERATOR_QUICKSTART.md`, `docs/TROUBLESHOOTING.md`, `docs/CLI_USAGE.md`
- `release-smoke.ps1`, `release-smoke.cmd`, `docs/RELEASE_SMOKE.md`
- `ArchLucid.Api/ProblemDetails/ProblemSupportHints.cs`, `ArchLucid.Api/ProblemDetails/*` (extensions wiring)
- `ArchLucid.Cli/CliOperatorHints.cs`
- `archlucid-ui/src/app/api/proxy/[...path]/route.ts`, `docs/API_CONTRACTS.md` (problem extensions)
- `.github/workflows/ci.yml` (SourceRevisionId stamping)

---

## 57R — operator-journey E2E (Playwright)

## Prompt 1 — deterministic fixtures + proxy route interception

**Scope:** `archlucid-ui` only. No production behavior changes.

**Delivered:**

- `e2e/fixtures/` — typed JSON-shaped payloads aligned with `coerceRunDetail`, `coerceManifestSummary`, `coerceArtifactDescriptorList`, `coerceRunComparison`, `coerceGoldenManifestComparison`, `coerceComparisonExplanation`.
- `e2e/helpers/route-match.ts` — centralized pathname + query matching for `/api/proxy/...` → backend paths (avoids brittle full-URL string equality).
- `e2e/helpers/register-operator-api-routes.ts` — single `page.route('**/*')` dispatcher with `registerOperatorJourneyApiRoutes(page, config)`; presets `registerCompareAndExplainRoutes`, `registerDefaultRunManifestArtifactRoutes`; optional artifact bundle GET/HEAD.
- `e2e/compare-proxy-mock.spec.ts` — exercises **client** compare flow (browser → `/api/proxy`) with mocks.
- `e2e/smoke.spec.ts` — assertions updated to match the current home page (`ArchLucid` **h1** in layout, **Start here** **h2** on `/`).

**Note:** Run and manifest **RSC** pages call the API from the Next server (`getServerApiBaseUrl`); they are **not** covered by `page.route` interception. Prompt 2 adds a **loopback mock HTTP server** started alongside Next for Playwright so RSC receives the same fixture payloads.

---

## Prompt 2 — run detail → manifest → back (E2E)

**Delivered:**

- `e2e/mock-archlucid-api-server.ts` — serves `GET /health`, run detail, manifest summary, and artifact list for fixture IDs (imports `e2e/fixtures`).
- `e2e/start-e2e-with-mock.ts` — Playwright `webServer` entry: starts mock on **127.0.0.1:18765** (override with `E2E_MOCK_API_PORT`), sets **`ARCHIFORGE_API_BASE_URL`**, then `next start -p 3000`.
- `e2e/run-manifest-journey.spec.ts` — linear journey with role/text assertions (no snapshots).
- `playwright.config.ts` — `webServer` runs **build** then **start-e2e-with-mock** (not `npm run start` alone).
- **`tsx`** devDependency — runs the TypeScript mock + launcher.
- Root `tsconfig.json` **`exclude`: `e2e`** so Next build does not typecheck E2E-only files; **`e2e/tsconfig.json`** + **`npm run typecheck:e2e`** cover them.

**Caveat:** `reuseExistingServer: true` with a hand-started `npm run start` that does **not** point at the mock will fail this journey until you use the Playwright-managed stack or set **`ARCHIFORGE_API_BASE_URL=http://127.0.0.1:18765`** and run the mock separately.

---

## Prompt 3 — compare journey (query prefill + review order)

**Delivered:**

- `e2e/compare-journey.spec.ts` — opens `/compare?leftRunId&rightRunId` with fixture IDs; asserts placeholder inputs prefilled; **`registerOperatorJourneyApiRoutes`** with legacy + structured fixtures only (no AI); clicks **Compare**; asserts **Compare runs** heading, 55R-style guidance (**structured first** / **legacy flat diff**), **`#compare-structured`** and **`#compare-legacy`**, **Review order** nav (structured link before legacy), **Last compare request** region with both outcomes **OK**; uses fixture-backed rows (**topology** / **serviceCount**) for legacy visibility. Waits on visible content only (no fixed sleeps).

---

## Prompt 4 — compare stale input warning

**Delivered:**

- `e2e/compare-stale-input-warning.spec.ts` — self-contained flow: mock legacy + structured, compare, change base run ID, assert **`OperatorWarningCallout`** copy (**Run IDs no longer match the results below.**, **Content below still reflects**, prior pair in **`code`**, **restore the previous values**); then restore the original left ID and assert the warning copy is gone.

---

## Prompt 5 — manifest empty artifact list vs bundle affordance

**Delivered:**

- **`FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID`** + **`fixtureManifestSummaryEmptyArtifacts()`** — same coercion contract as other manifest summaries; artifact list stub returns **`[]`** for that id only.
- **`e2e/mock-archlucid-api-server.ts`** — routes summary + artifact list for the new manifest id (empty array).
- **`e2e/manifest-empty-artifacts.spec.ts`** — RSC load of `/manifests/...`; asserts **no** artifact-list **failure/malformed** callouts; **`OperatorEmptyState`** (**No artifacts listed for this manifest**) with **valid empty result** + **Bundle ZIP may return 404** copy; **Download bundle (ZIP)** link present with **`href`** containing manifest id and **`bundle`**; **no** artifact table headers. File-level comment documents distinction vs request failures and bundle semantics.

**Out of scope (per prompt):** no simulated bundle download / `page.route` click-through — keeps the spec stable; operator copy already separates empty list from ZIP availability.

---

## Prompt 6 — Playwright harness cleanup and readability pass

**Scope:** `archlucid-ui/e2e` only. Small helpers; specs stay explicit.

**Delivered:**

- **`registerDefaultPairLegacyStructuredCompare(page)`** in `e2e/helpers/register-operator-api-routes.ts` — single definition of legacy + structured mocks for the standard left/right fixture pair; **`registerCompareAndExplainRoutes`** reuses the same config and adds AI explain only.
- **`e2e/helpers/operator-journey.ts`** — operator-oriented navigation (`gotoComparePageWithFixturePair`, `gotoRunDetailForMockFixtureRun`, `gotoManifestDetail`, `gotoManifestEmptyArtifactsOperatorCase`), **`comparePairSearchParams`** for deterministic query strings, and **`expectComparisonRequestOutcomeVisible`** where it removed duplication.
- **`compare-journey.spec.ts`**, **`compare-stale-input-warning.spec.ts`**, **`run-manifest-journey.spec.ts`**, **`manifest-empty-artifacts.spec.ts`** — refactored to use the helpers above; **`compare-proxy-mock.spec.ts`** unchanged (still uses **`registerCompareAndExplainRoutes`**).

---

## Prompt 7 — optional Playwright from release-smoke

**Scope:** Root **`release-smoke.ps1`** / **`release-smoke.cmd`** and **`docs/RELEASE_SMOKE.md`**. Default behavior unchanged.

**Delivered:**

- **`-RunPlaywright`** — after the normal smoke steps (UI and, unless **`-SkipE2E`**, API+CLI+artifact checks), runs **`archlucid-ui`** **`npm run test:e2e`** with **`CI=1`**. Section header **`=== Playwright E2E (opt-in: -RunPlaywright) ===`**. Exits non-zero if Playwright fails; errors if Node is missing when the flag is set.
- **`-SkipE2E`** path still runs Playwright when **`-RunPlaywright`** is set (after UI); **`npm ci`** runs in **`archlucid-ui`** when **`-SkipUi`** or missing **`node_modules`** so E2E can run without the standard UI step.
- **`release-smoke.cmd`** passes **`%*`** unchanged (flags work from CMD). **`docs/RELEASE_SMOKE.md`** documents the switch, examples, and Playwright troubleshooting.

---

## Prompt 8 — documentation for 57R E2E contract

**Scope:** Docs only; wording aligned with **`e2e/*.spec.ts`**, **`playwright.config.ts`**, and **`release-smoke`** behavior.

**Delivered:**

- **`archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md`** — section 8 rewritten: per-spec journey table, mock strategies (loopback server vs **`page.route`**), explicit **non-goals**, how to run **`npm run test:e2e`** / **`test-ui-smoke`** / **`-RunPlaywright`**, troubleshooting note when mocks pass but a real API fails.
- **`archlucid-ui/README.md`** — Tests + doc table updated for **57R** Playwright scope and links.
- **`docs/RELEASE_SMOKE.md`** — subsection **What `-RunPlaywright` actually exercises (57R)**; independence from C# API smoke; restored **`-RunPlaywright`** row in the parameters table.
- **`README.md`** — Key docs table, pilot handoff paragraph, Operator UI paragraph: concise **57R** / Playwright pointers without overstating coverage.

---

## Prompt 9 — focused validation pass

**Scope:** Run Vitest, Playwright, and repo UI smoke scripts; fix failures only where needed for a coherent slice.

**Validation run (green):**

- **`archlucid-ui`:** `npm test` (71 tests), `npm run typecheck:e2e`, `CI=1` / `npm run test:e2e` (6 Playwright tests).
- **Repo root:** `.\test-ui-smoke.ps1` after script fix.

**Fix delivered:**

- **`test-ui-smoke.ps1`**, **`test-ui-unit.ps1`**, **`release-smoke.ps1`** — on Windows, call **`npm.cmd`** (and **`npx.cmd`** in smoke) when available so **`Set-StrictMode -Version Latest`** does not execute Node’s **`npm.ps1`** shim (which can throw **`PropertyNotFoundStrict`** on **`$MyInvocation.Statement`**). Non-Windows unchanged (**`npm`** only).

---

## 58R — product learning dashboard and improvement triage

## 1. Objective

Give product and pilot stakeholders a **disciplined, queryable trail** of how ArchLucid outputs are received: what is trusted, rejected, or repeatedly revised, and which **repeat patterns** deserve engineering investment — **without** autonomous adaptation or silent policy changes in this change set.

## 2. Assumptions

- Feedback is **human-entered** (operators, pilots, or internal product roles), not inferred from model logits alone.
- **Tenant / workspace / project** scope continues to partition data; aggregation stays within scope unless a later prompt adds cross-tenant analytics (explicitly out of scope here).
- **SQL Server** is the system of record when `ArchLucid:StorageProvider` is `Sql`; **InMemory** uses the same repository interface for local dev.

## 3. Constraints

- **C#** only for application code; **Dapper** for SQL access; **no Entity Framework**.
- **Deterministic** list ordering (newest first, stable tie-break on `SignalId`).
- **No autonomous adaptation**: inserts do not alter prompts, rule packs, or agent configuration.
- **Reuse** existing scope columns and migration/DbUp patterns.

## 4. Architecture overview

**Nodes:** **Product-learning repository**, SQL table **`ProductLearningPilotSignals`**, **read APIs** (`/v1/product-learning/...`), **operator UI** (**Pilot feedback** page), optional future HTTP write for pilots.  
**Edges:** Human judgment → persisted signal → aggregation services → dashboard / export → triage discussion.  
**Boundaries:** Distinct from **advisory `RecommendationRecords`** / **`RecommendationLearningProfiles`** (those score advisory outputs). 58R targets **cross-cutting pilot feedback** on manifests, artifacts, and runs.

## 5. Component breakdown

| Layer | Responsibility |
|--------|----------------|
| **Contracts** (`ArchLucid.Contracts.ProductLearning`) | Stable strings + `ProductLearningPilotSignalRecord` DTO. |
| **Persistence** | `IProductLearningPilotSignalRepository`, Dapper + in-memory implementations. |
| **SQL** | DbUp `031_*.sql` + `ArchLucid.sql` parity. |
| **API** | `ProductLearningController`: summary, opportunities, trends, triage queue, triage report (`markdown` / `json`). |
| **UI** | Operator shell **Pilot feedback** (`/product-learning`), export links; nav distinct from **Learning** (recommendation learning). |
| **Docs** | [PRODUCT_LEARNING.md](PRODUCT_LEARNING.md) — operator & product-owner workflow. |

## 6. Data flow

1. **Write:** Integrators insert rows via **`IProductLearningPilotSignalRepository`** (scope, disposition, subject, optional pattern key, comment, run link). A first-party **HTTP POST** for pilots may follow in a later change.
2. **Aggregate:** Repository methods + **`IProductLearningFeedbackAggregationService`** / **`IProductLearningDashboardService`** build rollups, trends, ranked opportunities, triage queue (deterministic ordering).
3. **Expose:** **`GET /v1/product-learning/*`** and operator **Pilot feedback** page; **report** endpoints emit concise Markdown/JSON triage summaries (not full raw comments).

## 7. Security model

- Rows are **scope-scoped**; read/report endpoints use the same **tenant/workspace/project** resolution as other operator APIs (`ReadAuthority`).
- **No secrets** in `DetailJson` by convention; operators should not paste credentials.
- Optional `ArchitectureRunId` FK ensures referential integrity when a string run id is supplied.

## 8. Operational considerations

- **DbUp** applies `031_ProductLearningPilotSignals.sql` on API startup against SQL Server.
- **Persistence bootstrap** (`ArchLucid.sql`) creates the same objects on greenfield databases.
- **Indexes** support scope + time, scope + disposition, and filtered **pattern** lookups.

---

## Prompt log

### Prompt 1 — persistence foundation

- Added **`ProductLearningPilotSignals`** table (disposition CHECK, triage CHECK, optional FK to **`ArchitectureRuns`**).
- Added **contracts**, **Dapper + in-memory repositories**, **DI registration** for Sql and InMemory storage.
- **Tests:** in-memory repository unit tests.
- **Docs:** `CHANGE_SET_58R.md`, `DATA_MODEL.md`, `SQL_SCRIPTS.md` catalog.

**Next prompt (suggested):** HTTP API (scoped POST/GET), authorization aligned with operator/admin roles, and optional aggregate DTO for pattern × disposition counts.

### Prompt 2 — aggregation and triage domain models

- **Added** explicit DTO classes (no logic): `FeedbackAggregate`, `ArtifactOutcomeTrend`, `ImprovementOpportunity`, `LearningDashboardSummary`, `TriageQueueItem` under `ArchLucid.Contracts/ProductLearning/`.
- **Next:** repository/query methods and application service to populate these models from `ProductLearningPilotSignals` (and optional joins).

### Prompt 3 — SQL/Dapper aggregation queries

- **Extended** `IProductLearningPilotSignalRepository` with aggregation methods over **`ProductLearningPilotSignals`** (no new tables).
- **Dapper:** explicit CTE/grouped SQL + internal row DTOs (`ProductLearningPilotSignalSqlRows.cs`); in-memory path uses shared **`ProductLearningSignalAggregations`** rules so behavior matches SQL.
- **Added** `RepeatedCommentTheme` contract for deterministic comment-prefix rollups.
- **Tests:** in-memory repository coverage for aggregates, top reject/revise, comment themes, opportunity thresholds.

### Prompt 4 — product learning / triage service layer

- **Contracts:** `ProductLearningScope`, `ProductLearningTriageOptions`, `ProductLearningAggregationSnapshot`, and service interfaces (`IProductLearningFeedbackAggregationService`, `IProductLearningImprovementOpportunityService`, `IProductLearningDashboardService`).
- **Persistence:** `ProductLearningFeedbackAggregationService`, `ProductLearningImprovementOpportunityService`, `ProductLearningDashboardService`, `ProductLearningOpportunityScoring` (deterministic scoring helpers).
- **Repository:** `CountSignalsInScopeAsync`, `CountDistinctArchitectureRunsWithSignalsAsync` for accurate dashboard totals.
- **DI:** registered scoped (SQL) / singleton (in-memory) alongside `IProductLearningPilotSignalRepository`.
- **Tests:** dashboard + count smoke tests.

### Prompts 5–8 (summary)

- **HTTP API** for dashboard slices (`summary`, `improvement-opportunities`, `artifact-outcome-trends`, `triage-queue`) with query validation.
- **Operator UI** dashboard + **export** (`report`, `report/file`).
- **Focused tests** (`ChangeSet=58R` / `ProductLearning` filters): aggregation, ranking, parser, API, report builder, URL helpers.

### Prompt 9 — documentation

- **Added** [PRODUCT_LEARNING.md](PRODUCT_LEARNING.md) (capture, dashboard, opportunities, export, owner guidance).
- **Updated** [PILOT_GUIDE.md](PILOT_GUIDE.md), [OPERATOR_QUICKSTART.md](OPERATOR_QUICKSTART.md), [README.md](../REPOSITORY_README.md), [archlucid-ui/README.md](../archlucid-ui/README.md), this file (overview §4–§7, component table, prompt log).

### Coherence / cleanup pass (post–Prompt 9)

- **Aggregation:** `GetSnapshotAsync` no longer calls `ListTopRejectedRevisedArtifactRollupsAsync` — that slice was never consumed by dashboard, opportunities, or export (extra SQL work only). `TopRejectedRevisedRollups` on the snapshot stays **empty** until a future feature uses it; documented on the contract and in [DATA_MODEL.md](DATA_MODEL.md).
- **Dashboard notes:** Removed the summary line that duplicated KPI chip counts (less noise in the expandable “How to read” list).
- **Naming:** Clarified `ProductLearningTriageReportDocument.DistinctRunsReviewed` ↔ `LearningDashboardSummary.DistinctRunsTouched` in XML; `TopRejectedRevisedTake` option documented as unused by aggregation today.
- **Docs:** [PRODUCT_LEARNING.md](PRODUCT_LEARNING.md) states the UI issues **four** aligned GETs per refresh.

---

## 59R — learning-to-planning bridge

## 1. Objective

Turn **58R product-learning aggregates** into **structured improvement themes** and **bounded, human-reviewable improvement plans**, with **explicit links** to runs, artifacts, pilot feedback, and triage context—using **deterministic** rules and **no autonomous system mutation**.

## 2. Assumptions

- Operators or integrators **materialize** themes and plans (or a future service does so **explicitly** under policy), rather than the runtime silently changing prompts or packs.
- **Opportunity IDs** from live `ImprovementOpportunity` projections may be **ephemeral** today; persisted themes use stable **`ThemeKey`** plus optional **`SourceAggregateKey`** / **`PatternKey`** for traceability.

## 3. Constraints

- **C#**, **SQL Server**, **Dapper**; no Entity Framework.
- **No changes** to core generation/evaluation logic in 59R.
- **Scoped** data same as **`ProductLearningPilotSignals`**.

## 4. Architecture overview

**Nodes:** SQL tables for themes and plans, junction tables for links, **`IProductLearningPlanningRepository`**.  
**Edges:** Theme ← plan → (runs, signals, artifacts).  
**Flows (future prompts):** read 58R snapshot → derive themes → derive plans + priority explanation → optional HTTP/UI.

## 5. Prompt log

### Prompt 1 — persistence foundation

- **DbUp** `032_ProductLearningPlanningBridge.sql` + **`ArchLucid.sql`** parity.
- **Contracts** under `ArchLucid.Contracts/ProductLearning/Planning/`.
- **Persistence:** `IProductLearningPlanningRepository`, `DapperProductLearningPlanningRepository`, `InMemoryProductLearningPlanningRepository`, validation + JSON helpers.
- **DI:** registered in `ArchLucidStorageServiceCollectionExtensions` (scoped SQL / singleton in-memory).
- **Tests:** `ProductLearningPlanningRepositoryTests`.
- **Docs:** `SQL_SCRIPTS.md`, `DATA_MODEL.md`, this file.

**Next prompt (suggested):** deterministic **theme derivation** service consuming `IProductLearningImprovementOpportunityService` / aggregation snapshot; stable **`ThemeKey`** builder; optional **plan draft** builder with **priority score + explanation** from frequency, severity, trust.

---
