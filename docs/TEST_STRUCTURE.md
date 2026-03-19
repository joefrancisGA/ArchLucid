# Test structure

## Projects

- **ArchiForge.Api.Tests** — API integration tests using `WebApplicationFactory` (full app, in-memory SQLite). Heavier; use for HTTP contracts, comparison replay, exports, run-not-found, 422/409.
- **ArchiForge.DecisionEngine.Tests** — Unit and scenario tests for the decision engine; optional integration tests with real JSON schemas (see `SchemaValidationIntegrationTests`).
- **ArchiForge.Coordinator.Tests**, **ArchiForge.AgentRuntime.Tests**, **ArchiForge.Decisioning.Tests**, etc. — Domain/component tests; no web stack unless explicitly added.

## Categories (optional filtering)

All tests in **ArchiForge.Api.Tests** that extend **IntegrationTestBase** (and thus use `WebApplicationFactory`) are integration tests. They are tagged at class level with:

```csharp
[Trait("Category", "Integration")]
```

Use this to filter runs: exclude with `Category!=Integration` for faster feedback, or run only integration tests with `Category=Integration`. Other projects (e.g. **DecisionEngine.Tests**) use the same trait on individual tests that need real I/O (e.g. `SchemaValidationIntegrationTests`).

To run only fast/unit tests (exclude integration):

```bash
dotnet test --filter "Category!=Integration"
```

To run only integration tests:

```bash
dotnet test --filter "Category=Integration"
```

## Fixtures and shared setup

- **IntegrationTestBase** (Api.Tests) — provides `HttpClient`, `JsonOptions`, and `JsonContent(object)` from `ArchiForgeApiFactory`. Tests that extend it should use the base `JsonOptions` and `JsonContent` for request/response JSON so behavior is consistent and configurable in one place.
- **ComparisonReplayTestFixture** (Api.Tests) — static helpers: `CreateRunExecuteCommitReplayAsync`, `PersistEndToEndComparisonAsync` for comparison-replay flows.

**Unit-style tests in Api.Tests:** Some tests do *not* extend **IntegrationTestBase** (e.g. **AgentResultDiffServiceTests**, **ManifestDiffServiceTests**, **ApiProblemDetailsExceptionFilterTests**, **ArchitectureApplicationServiceTests**, **DatabaseMigrationScriptTests**). They do not spin up the full API; they test services, filters, or scripts in isolation. These are tagged with `[Trait("Category", "Unit")]` so you can run only unit tests with `dotnet test --filter "Category=Unit"`.

No separate unit-only test project exists; use `[Trait("Category", "Integration")]` or `Category=Unit` and filter as above if you want to separate runs.
