# Next five refactorings

Candidates for the next round of refactors, in rough priority order.

---

## 1. Unify Api.Tests JSON options

**Problem:** Several tests that extend `IntegrationTestBase` still use `new JsonOptions().JsonSerializerOptions` instead of the inherited `JsonOptions` (and some use it for `ReadFromJsonAsync` only, while the base also provides `JsonContent(object)`).

**Change:**
- In **ArchitectureControllerTests**, **ArchitectureDiagramTests**, and **ArchitectureSummaryTests**, replace every `new JsonOptions().JsonSerializerOptions` with `JsonOptions`, and use `JsonContent(...)` from the base where building request bodies.
- Optionally add a single shared `JsonSerializerOptions` in a test helper if any tests don’t inherit `IntegrationTestBase` but need the same options.

**Outcome:** One place to tune JSON behavior; consistent test style.

---

## 2. Use ComparisonReplayTestFixture in end-to-end comparison tests

**Problem:** **ArchitectureEndToEndComparisonExportTests** and **ArchitectureEndToEndComparisonTests** (and any similar) repeat the same flow: create run → execute → commit → replay, then call compare/export by `leftRunId`/`rightRunId`. Only **ComparisonReplayVerifyDriftIntegrationTests** currently uses **ComparisonReplayTestFixture**.

**Change:**
- In **ArchitectureEndToEndComparisonExportTests** and **ArchitectureEndToEndComparisonTests**, use `ComparisonReplayTestFixture.CreateRunExecuteCommitReplayAsync(Client, JsonOptions)` to obtain `(runId, replayRunId)`, then call the compare/export endpoints with those IDs.
- Where a test needs a **persisted** comparison (e.g. for replay by `comparisonRecordId`), also use `PersistEndToEndComparisonAsync` and then hit the comparisons replay endpoint.

**Outcome:** Less duplicated setup; changes to the create/execute/commit/replay flow live in one fixture.

---

## 3. RunComparisonController: optional facade for end-to-end services

**Problem:** **RunComparisonController** injects three application services for end-to-end comparison: `IEndToEndReplayComparisonService`, `IEndToEndReplayComparisonSummaryFormatter`, `IEndToEndReplayComparisonExportService`. That’s a lot of constructor parameters and ties the API to three separate abstractions.

**Change (optional):**
- Introduce an application-level facade, e.g. **`IEndToEndComparisonFacade`** (or **`IRunComparisonAppService`**), in **ArchiForge.Application**, with methods that delegate to the existing three services. Register the facade in **Program.cs** and inject it into **RunComparisonController** for the end-to-end summary/export actions; keep agent compare and audit as-is (or also behind the facade if you want a single “run comparison” entry point).
- Alternatively, leave the controller as-is and document that we intentionally keep the three services explicit for clarity and testability.

**Outcome:** Either a thinner controller and a single “comparison” dependency for those operations, or a documented decision to keep fine-grained dependencies.

---

## 4. Health check documentation

**Problem:** The API registers `AddHealthChecks()` with a database check and maps `/health`, but this isn’t documented for operators or in BUILD/README.

**Change:**
- In **README.md** or **docs/BUILD.md**, add a short “Health” section: what `/health` returns, that it includes a DB check, and that failure is unhealthy. Optionally mention readiness vs liveness if you later split them (e.g. liveness = no deps, readiness = DB).

**Outcome:** Clear contract for monitoring and runbooks.

---

## 5. Comparison replay request validation

**Problem:** The comparison replay endpoint accepts a body (format, replayMode, profile, persistReplay, etc.). Validation may be ad hoc or missing; OpenAPI and 400 responses could be more consistent.

**Change:**
- Add a **FluentValidation** validator for the comparison replay request DTO (e.g. **ReplayComparisonRequest** or whatever the bound model is). Validate format enum, replayMode, optional profile, etc.
- Register it with **AddValidatorsFromAssemblyContaining** (or the existing pattern). Ensure the controller uses the validated model so 400 responses and Swagger reflect the same rules.
- Optionally add a short note in **API_CONTRACTS.md** or Swagger description that validation errors return 400 with problem details.

**Outcome:** Consistent validation and better API docs for replay request shape.

---

## 6. Use ComparisonReplayTestFixture in ArchitectureComparisonReplayTests

**Problem:** **ArchitectureComparisonReplayTests** repeats the same create→execute→commit→replay flow, then persists via end-to-end summary and finally calls `POST comparisons/{comparisonRecordId}/replay`. Only the last step is unique; the rest matches **ComparisonReplayTestFixture**.

**Change:**
- Use `ComparisonReplayTestFixture.CreateRunExecuteCommitReplayAsync(Client, JsonOptions)` to get `(runId, replayRunId)`.
- Use `ComparisonReplayTestFixture.PersistEndToEndComparisonAsync(Client, runId, replayRunId)` to get `comparisonRecordId`.
- Then `POST /v1/architecture/comparisons/{comparisonRecordId}/replay` with the desired body (e.g. `{ format = "markdown" }`).

**Outcome:** One less place with duplicated run/replay/persist setup; consistent with other E2E comparison tests.

---

## 7. Audit remaining Api.Tests for JsonOptions / JsonContent

**Problem:** After refactorings 1–2, some test files may still use `new JsonOptions().JsonSerializerOptions` or construct request bodies without using the base `JsonContent(object)`. Inconsistencies make it harder to change JSON behavior in one place.

**Change:**
- Grep for `new JsonOptions()` or `JsonSerializerOptions` in **ArchiForge.Api.Tests** and replace with inherited `JsonOptions` where the test extends **IntegrationTestBase**.
- Where request bodies are built with `new StringContent(JsonSerializer.Serialize(...))`, prefer the base `JsonContent(value)` if the test has access to it.
- Optionally add a one-line note in **TEST_STRUCTURE.md** that integration tests should use the base `JsonOptions` and `JsonContent`.

**Outcome:** Full consistency across Api.Tests; single place to tune JSON for tests.

---

## Checklist (for “integrate all changes” later)

- [x] 1. Api.Tests: use `JsonOptions` / `JsonContent` from base everywhere
- [x] 2. Api.Tests: use `ComparisonReplayTestFixture` in E2E comparison and export tests
- [x] 3. Application + Api: optional `IEndToEndComparisonFacade` and controller refactor (or document “no facade”)
- [x] 4. Docs: health check section in README or BUILD.md
- [x] 5. Api: FluentValidation for comparison replay request + docs/OpenAPI alignment
- [x] 6. Api.Tests: use `ComparisonReplayTestFixture` in **ArchitectureComparisonReplayTests** (create→execute→commit→replay→persist via fixture, then call `comparisons/{id}/replay`)
- [x] 7. Api.Tests: audit remaining tests for `JsonOptions` / `JsonContent` — any file still using `new JsonOptions().JsonSerializerOptions` or not using base `JsonContent` should be updated for consistency

---

## 8. Rate limiting documentation

**Problem:** The API configures three rate-limit policies (`fixed`, `expensive`, `replay`) and README only briefly mentions “100 requests per minute”. Operators and clients don’t have a clear reference for policy names, behavior, and config keys.

**Change:**
- Add a short **Rate limiting** section in **README.md** or **docs/BUILD.md**: policy names (`fixed` = general, `expensive` = execute/commit/replay, `replay` = comparison replay with light/heavy by format); that 429 is returned when exceeded; config keys `RateLimiting:FixedWindow:*`, `RateLimiting:Expensive:*`, `RateLimiting:Replay:Light:*`, `RateLimiting:Replay:Heavy:*`.

**Outcome:** Clear contract for tuning and runbooks.

---

## 9. ReplayComparisonRequest validation test

**Problem:** We added **ReplayComparisonRequestValidator** but have no test that asserts invalid request body returns 400 with validation problem details.

**Change:**
- In **ArchiForge.Api.Tests**, add a test (e.g. in **ComparisonReplayVerify422Tests** or a new **ComparisonReplayValidationTests**) that uses a valid comparison record ID, POSTs to `comparisons/{id}/replay` with body `{ "format": "invalid", "replayMode": "bad" }`, and asserts status 400 and response body contains validation error messages (or problem details type).

**Outcome:** Regression protection for replay request validation.

---

## 10. CreateRunAndExecuteAsync helper (optional)

**Problem:** Tests like **ArchitectureReplayTests** (first test) do create run → execute, then call replay. They don’t need commit or replay from the fixture; a smaller helper would reduce duplication.

**Change:**
- Add **ComparisonReplayTestFixture.CreateRunAndExecuteAsync(Client, JsonOptions, requestId)** that returns `runId` (create + execute only). Use it in **ArchitectureReplayTests** where only runId after execute is needed. Leave tests that need commit/replay payloads as-is unless they can use the full fixture.

**Outcome:** Less duplicated create+execute setup in replay-focused tests.

---

## 11. Program.cs: extract service registration into extension methods

**Problem:** **Program.cs** has a long block of `AddScoped`/`AddSingleton`/`Configure` calls. Harder to scan and to test registration in isolation.

**Change:**
- Create **ArchiForge.Api/Startup/ServiceCollectionExtensions.cs** (or similar) with extension methods such as `AddArchiForgeApplicationServices(this IServiceCollection services, IConfiguration configuration)` and `AddArchiForgeApiServices(this IServiceCollection services)` that move the relevant registrations out of **Program.cs**. Call them from **Program.cs** so the host file stays short and grouped by feature (e.g. AddControllers, AddRateLimiter, AddArchiForgeApplicationServices, MapEndpoints).

**Outcome:** Clearer **Program.cs** and a single place to see all application service wiring.

---

## 12. Trait("Category", "Integration") and TEST_STRUCTURE

**Problem:** Only a few tests are tagged `[Trait("Category", "Integration")]`. Filtering “fast vs integration” is inconsistent; TEST_STRUCTURE doesn’t list which test classes are considered integration.

**Change:**
- Add `[Trait("Category", "Integration")]` to test classes that use **WebApplicationFactory** and hit the full API (e.g. **ArchitectureControllerTests**, **ArchitectureComparisonReplayTests**, **ArchitectureEndToEndComparisonExportTests**). Optionally tag at class level so `dotnet test --filter "Category!=Integration"` excludes all of them. Update **docs/TEST_STRUCTURE.md** with a short list or rule: “All tests in Api.Tests that extend IntegrationTestBase are integration tests; tag with Category=Integration for filtering.”

**Outcome:** Consistent filtering and documented convention.

---

## Checklist (continued)

- [x] 8. Docs: rate limiting section (policies, 429, config keys)
- [x] 9. Api.Tests: test that invalid replay request body returns 400 with validation errors
- [x] 10. Api.Tests: optional CreateRunAndExecuteAsync helper; use in ArchitectureReplayTests where it fits
- [x] 11. Api: extract Program.cs service registration into extension methods
- [x] 12. Api.Tests: add [Trait("Category", "Integration")] to integration test classes; document in TEST_STRUCTURE

---

## 13. CORS documentation

**Problem:** The API configures CORS (policy name `ArchiForge`, config key `Cors:AllowedOrigins`) but this isn’t documented. Operators don’t know how to allow cross-origin calls.

**Change:**
- In **README.md** or **docs/BUILD.md**, add a short **CORS** note: config key `Cors:AllowedOrigins` (array of origins); if empty or missing, no origins are allowed (`SetIsOriginAllowed(_ => false)`). Policy name `ArchiForge` is used by `UseCors("ArchiForge")`.

**Outcome:** Clear setup for SPA or cross-origin API clients.

---

## 14. BatchReplayComparisonRequest validation

**Problem:** **ReplayComparisonRequest** has a FluentValidation validator; **BatchReplayComparisonRequest** (used by batch replay endpoint) has similar properties (Format, ReplayMode, Profile, PersistReplay) plus `ComparisonRecordIds` but no validator.

**Change:**
- Add **BatchReplayComparisonRequestValidator** (FluentValidation): require `ComparisonRecordIds` not empty; reuse or mirror Format/ReplayMode/Profile rules from **ReplayComparisonRequestValidator**. Register with existing `AddValidatorsFromAssemblyContaining`. Optionally document 400 for batch replay in **API_CONTRACTS.md**.

**Outcome:** Consistent validation and 400 responses for invalid batch replay body.

---

## 15. ComparisonReplayVerify422Tests trait

**Problem:** **ComparisonReplayVerify422Tests** uses a custom **ComparisonVerify422ApiFactory** (not **IntegrationTestBase**) but is still an integration test (full API, swapped service). It isn’t tagged, so `dotnet test --filter "Category=Integration"` doesn’t include it.

**Change:**
- Add `[Trait("Category", "Integration")]` at class level to **ComparisonReplayVerify422Tests** so it’s grouped with other integration tests for filtering.

**Outcome:** Consistent integration test filtering.

---

## 16. Api.Tests unit-style tests in TEST_STRUCTURE

**Problem:** Some tests in **ArchiForge.Api.Tests** don’t use **WebApplicationFactory** (e.g. **AgentResultDiffServiceTests**, **ManifestDiffServiceTests**, **ApiProblemDetailsExceptionFilterTests**, **ArchitectureApplicationServiceTests**, **DatabaseMigrationScriptTests**). They’re unit or in-process tests. TEST_STRUCTURE doesn’t mention them.

**Change:**
- In **docs/TEST_STRUCTURE.md**, add a short paragraph: Api.Tests also contains tests that don’t extend **IntegrationTestBase** (e.g. service/filter unit tests, migration script tests). These don’t spin up the full API. Optionally add `[Trait("Category", "Unit")]` to such classes so `dotnet test --filter "Category=Unit"` runs only them (and similar in other projects).

**Outcome:** Clear distinction and optional filtering for unit vs integration in Api.Tests.

---

## 17. Program.cs: extract rate limiter and CORS into extensions

**Problem:** **Program.cs** still contains the **AddRateLimiter** and **AddCors** blocks (and possibly auth policies). Moving them into extension methods would make Program.cs even thinner and group config by concern.

**Change:**
- Add **AddArchiForgeRateLimiting(this IServiceCollection services, IConfiguration configuration)** in **Startup/** (e.g. in a new **RateLimitingExtensions.cs** or in **ServiceCollectionExtensions.cs**) and move the existing **AddRateLimiter** lambda there. Add **AddArchiForgeCors(this IServiceCollection services, IConfiguration configuration)** and move the **AddCors** block. Call both from **Program.cs** after **AddArchiForgeApplicationServices**. Optionally move **AddAuthorization** policy configuration into an **AddArchiForgeAuthorization** extension.

**Outcome:** Shorter Program.cs; rate limiting and CORS config in one place each.

---

## Checklist (continued)

- [x] 13. Docs: CORS section (config key, policy name, behavior when empty)
- [x] 14. Api: FluentValidation for BatchReplayComparisonRequest + optional API_CONTRACTS note
- [x] 15. Api.Tests: [Trait("Category", "Integration")] on ComparisonReplayVerify422Tests
- [x] 16. Docs: TEST_STRUCTURE note on unit-style tests in Api.Tests; optional Category=Unit trait
- [x] 17. Api: extract AddRateLimiter and AddCors (and optionally AddAuthorization) into extension methods
