> **Scope:** For engineers migrating the authority pipeline to the Durable Task Framework in Cursor after `IAuthorityRunOrchestrator` extraction; sequenced prompts only—not persistence DDL, rollout policy, or unrelated run subsystems.

# Cursor Prompts — GA Task #26 (Authority pipeline: DTF migration)

> **Canonical file:** `docs/library/CURSOR_PROMPTS_GA_TASK_26_AUTHORITY_DTF.md`  
> **Created:** 2026-05-15  
> **Source:** `docs/assessments/LATEST.md` improvement #26 — Migrate `AuthorityRunOrchestrator` to the Durable Task Framework (scoped V1 slice)  
> **See also:** `CURSOR_PROMPTS_GA_TASKS_27_32.md` (GA tasks #27–#32)  
> **Prerequisites:** The interface-extraction phase is complete — `IAuthorityRunOrchestrator` lives in `ArchLucid.Application.Runs.Orchestration`, `AuthorityRunOrchestratorApplicationAdapter` bridges it to the legacy `ArchLucid.Persistence.Orchestration.AuthorityRunOrchestrator`, both storage-provider registrars wire the interface, and unit tests for the legacy path are finishing.  
> **Scope:** These prompts pick up **after** the unit-test phase. Work through them one at a time; each prompt is designed to be copy-pasted into a fresh Cursor session.

---

## P26-2 — Feature-Flag Property in `AuthorityPipelineOptions`

```
Add an `OrchestratorBackend` enum and property to `ArchLucid.Core/Authority/AuthorityPipelineOptions.cs`
so the caller can switch between the legacy SQL orchestrator and the coming DTF implementation at
configuration time, without a redeploy.

WHAT TO ADD

1. Create a new file `ArchLucid.Core/Authority/OrchestratorBackend.cs` with:

   namespace ArchLucid.Core.Authority;

   /// <summary>Selects which orchestration substrate executes the authority pipeline.</summary>
   public enum OrchestratorBackend
   {
       /// <summary>Hand-rolled SQL-backed state machine (current default).</summary>
       Legacy,

       /// <summary>Durable Task Framework with SQL Server storage backend.</summary>
       DurableTask
   }

2. Add the following property to the existing `AuthorityPipelineOptions` class (place after
   `HaltOnPartialFindings`):

   /// <summary>
   ///     Selects the orchestration substrate for authority pipeline runs. Defaults to
   ///     <see cref="OrchestratorBackend.Legacy" />. Switch to
   ///     <see cref="OrchestratorBackend.DurableTask" /> only after parity tests pass and a full
   ///     release-smoke run completes with DTF active (see improvement #26 in LATEST.md).
   /// </summary>
   public OrchestratorBackend OrchestratorBackend { get; set; } = OrchestratorBackend.Legacy;

   Configuration key path: ArchLucid:AuthorityPipeline:OrchestratorBackend

3. Add a test in `ArchLucid.Core.Tests` (or the nearest existing test project that covers Core
   options classes) that verifies:
   - Default value is OrchestratorBackend.Legacy.
   - Both enum values round-trip through IConfiguration binding (use
     Microsoft.Extensions.Configuration.Memory with "ArchLucid:AuthorityPipeline:OrchestratorBackend"
     = "DurableTask").

CONSTRAINTS
- Keep the existing SectionName = "AuthorityPipeline" on AuthorityPipelineOptions; no path change.
- Do NOT change AuthorityPipelineOptions.PipelineTimeout or HaltOnPartialFindings.
- OrchestratorBackend must NOT appear in ArchLucid.Contracts or ArchLucid.Application — it belongs
  in ArchLucid.Core because Core owns the options types that host composition reads.

ACCEPTANCE CRITERIA
- dotnet build ArchLucid.Core.slnf succeeds.
- The new unit test passes.
- No other files are changed in this session.
```

---

## P26-3 — Add DTF NuGet Packages

```
Add the Durable Task Framework NuGet packages to the host/composition project that will own the DTF
orchestrator implementation. Do NOT add them to ArchLucid.Application, ArchLucid.Contracts, or any
domain library.

PACKAGES TO ADD (latest stable versions — use `dotnet add package` to resolve)

In ArchLucid.Host.Composition/ArchLucid.Host.Composition.csproj:
  dotnet add package Microsoft.DurableTask.Client
  dotnet add package Microsoft.DurableTask.Worker
  dotnet add package Microsoft.DurableTask.SqlServer

No packages are needed in ArchLucid.Worker because the Worker host already references
ArchLucid.Host.Composition where DI wiring lives.

VERIFICATION STEPS
1. Run: dotnet restore ArchLucid.Host.Composition/ArchLucid.Host.Composition.csproj
2. Run: dotnet build ArchLucid.Backend.slnf  (or dotnet build ArchLucid.sln if the filter is not
   available in this environment)
3. Confirm the three Microsoft.DurableTask.* packages appear in the project's restored assets.
4. Grep ArchLucid.Application/**/*.cs, ArchLucid.Contracts/**/*.cs, ArchLucid.Core/**/*.cs for
   "Microsoft.DurableTask" — result must be empty (no leak from adding the reference).

ACCEPTANCE CRITERIA
- Build succeeds.
- No Microsoft.DurableTask reference appears outside ArchLucid.Host.Composition.
```

---

## P26-4 — Implement `DtfAuthorityRunOrchestrator`

```
Implement the DTF-backed authority pipeline orchestrator entirely within
ArchLucid.Host.Composition/Orchestration/. All Microsoft.DurableTask.* types must stay inside this
namespace — do NOT let them surface in ArchLucid.Application, ArchLucid.Contracts, or any domain
library.

BACKGROUND
The legacy path is ArchLucid.Persistence.Orchestration.AuthorityRunOrchestrator, which executes
ingestion → graph → findings → decision → artifacts → commit as a single in-process method.
AuthorityRunOrchestratorApplicationAdapter forwards IAuthorityRunOrchestrator calls to it.

The DTF path replaces the in-process execution with a durable orchestration so each stage is a
checkpoint-resumable activity. The IAuthorityRunOrchestrator interface contract does not change.

FILES TO CREATE

1. ArchLucid.Host.Composition/Orchestration/Dtf/DtfOrchestrationNames.cs
   Internal static class with string constants for orchestration and activity names:
   - AuthorityPipelineOrchestration
   - IngestContextActivity
   - BuildGraphActivity
   - RunFindingsActivity
   - RunDecisioningActivity
   - SynthesizeArtifactsActivity
   - CommitAndAuditActivity

2. ArchLucid.Host.Composition/Orchestration/Dtf/DtfAuthorityRunOrchestrator.cs
   internal sealed class DtfAuthorityRunOrchestrator : IAuthorityRunOrchestrator
   Primary dependencies (inject via primary constructor):
   - ITaskHubClient (from Microsoft.DurableTask.Client) for triggering orchestrations
   - IOptionsMonitor<AuthorityPipelineOptions> to read OrchestratorBackend and PipelineTimeout
   - ILogger<DtfAuthorityRunOrchestrator>

   ExecuteAsync: schedule a new orchestration instance via ITaskHubClient.ScheduleNewOrchestrationInstanceAsync
   using DtfOrchestrationNames.AuthorityPipelineOrchestration; wait for completion up to PipelineTimeout;
   deserialize and return the RunRecord result.

   CompleteQueuedAuthorityPipelineAsync: raise an external event on an existing orchestration instance
   to resume a queued run (use ITaskHubClient.RaiseEventAsync). If no orchestration exists yet for
   the run ID, schedule one directly.

3. ArchLucid.Host.Composition/Orchestration/Dtf/AuthorityPipelineOrchestrationFunction.cs
   The orchestrator function class decorated with [DurableTask] (or TaskOrchestrationBase<TInput, TOutput>
   — use whatever the Microsoft.DurableTask.Worker API requires). It calls each activity in sequence.
   Each stage corresponds to a DtfOrchestrationNames activity name.
   Emit an OpenTelemetry activity span at the start of each stage using ArchLucidInstrumentation (the
   existing ActivitySource already used by the legacy orchestrator).

4. ArchLucid.Host.Composition/Orchestration/Dtf/AuthorityPipelineActivities.cs
   One activity class per pipeline stage (or a single partial-class file if the DTF API requires
   attribute-based registration on separate methods). Each activity:
   - Resolves its required domain services from the injected IServiceProvider.
   - Calls the same IAuthorityPipelineStagesExecutor or individual service that the legacy path uses.
   - Emits the same durable AuditEvent types on completion:
       AuthorityRunStarted, AuthorityRunCompleted, AuthorityRunFailed (see AuditEventTypes in
       ArchLucid.Core.Audit and usage in AuthorityRunOrchestrator.cs).
   - Does NOT reduce audit coverage relative to the legacy orchestrator.

CONSTRAINTS
- No Microsoft.DurableTask.* type may appear in any using statement, method signature, or return
  type in ArchLucid.Application, ArchLucid.Contracts, or ArchLucid.Core.
- IAuthorityRunOrchestrator signature is unchanged.
- DtfAuthorityRunOrchestrator must be internal; it is registered in DI and never referenced by name
  outside ArchLucid.Host.Composition.

ACCEPTANCE CRITERIA
- dotnet build ArchLucid.Backend.slnf succeeds with no new errors or warnings.
- Running grep -r "Microsoft.DurableTask" ArchLucid.Application/ ArchLucid.Contracts/ ArchLucid.Core/
  returns no matches.
```

---

## P26-5 — DTF SQL Server Backend Setup

```
Configure the Durable Task Framework SQL Server backend in the SQL-path storage provider registrar
so orchestration history uses the existing ArchLucid SQL Server database. No new database is
introduced.

TARGET FILE
ArchLucid.Host.Composition/Configuration/SqlStorageProviderRegistrar.cs

WHAT TO ADD (inside RegisterSqlOperationalSingletons or a new private helper
RegisterDtfOrchestrationInfrastructure called from Register):

1. Read the ArchLucid connection string (already available in the method as `connectionString`).

2. Register the DTF SQL worker and client:
   services.AddDurableTaskWorker(builder =>
   {
       builder.AddTasks(registry => registry.AddAllGeneratedTasks());
       builder.UseSqlServer(connectionString);
   });

   services.AddDurableTaskClient(builder =>
   {
       builder.UseSqlServer(connectionString);
   });

   Wrap in:  if (IsDtfEnabled(configuration))
   so the background worker only starts when OrchestratorBackend = DurableTask. Implement
   IsDtfEnabled as a private static bool that reads
   "ArchLucid:AuthorityPipeline:OrchestratorBackend" and compares to "DurableTask"
   (case-insensitive string compare — avoids a dependency on enum parsing at this point in startup).

3. The DTF SQL backend creates its own schema tables on first run. Document in a code comment that
   the schema is managed by the DTF runtime and that DBA runbooks should include
   "dt." prefix tables in backup scope.

DO NOT CHANGE InMemoryStorageProviderRegistrar — the in-memory path always uses Legacy.

ACCEPTANCE CRITERIA
- dotnet build ArchLucid.Backend.slnf succeeds.
- When OrchestratorBackend = Legacy (default), no DTF background service starts.
- When OrchestratorBackend = DurableTask, the DTF worker registration is active.
```

---

## P26-6 — DI Wiring: Feature-Flag-Based Orchestrator Selection

```
Update the DI registration in both storage-provider registrars so the correct IAuthorityRunOrchestrator
implementation is resolved based on the OrchestratorBackend configuration value.

TARGET FILES
- ArchLucid.Host.Composition/Configuration/SqlStorageProviderRegistrar.cs
- ArchLucid.Host.Composition/Configuration/InMemoryStorageProviderRegistrar.cs

CURRENT REGISTRATION (both files, lines ~257-258):
  services.AddScoped<AuthorityRunOrchestrator>();
  services.AddScoped<IAuthorityRunOrchestrator, AuthorityRunOrchestratorApplicationAdapter>();

CHANGE FOR SqlStorageProviderRegistrar
Replace with a factory-based registration that reads OrchestratorBackend at resolve time:

  services.AddScoped<AuthorityRunOrchestrator>();
  services.AddScoped<DtfAuthorityRunOrchestrator>();
  services.AddScoped<IAuthorityRunOrchestrator>(sp =>
  {
      AuthorityPipelineOptions opts =
          sp.GetRequiredService<IOptionsMonitor<AuthorityPipelineOptions>>().CurrentValue;

      return opts.OrchestratorBackend switch
      {
          OrchestratorBackend.DurableTask => sp.GetRequiredService<DtfAuthorityRunOrchestrator>(),
          _ => sp.GetRequiredService<AuthorityRunOrchestratorApplicationAdapter>()
      };
  });

  Also register AuthorityRunOrchestratorApplicationAdapter as a concrete (non-interface) scoped
  service so the factory can resolve it:
  services.AddScoped<AuthorityRunOrchestratorApplicationAdapter>();

CHANGE FOR InMemoryStorageProviderRegistrar
Keep as-is (Legacy only):
  services.AddScoped<AuthorityRunOrchestrator>();
  services.AddScoped<IAuthorityRunOrchestrator, AuthorityRunOrchestratorApplicationAdapter>();
  (No DtfAuthorityRunOrchestrator in the InMemory path — DTF requires SQL.)

CONSTRAINTS
- OrchestratorBackend enum is in ArchLucid.Core.Authority; ensure the using is added.
- Do not break InMemoryStorageProviderRegistrar — it must still compile and pass its existing tests.
- The switch expression must have a default arm that returns the Legacy adapter so any unrecognised
  or future enum value degrades safely.

ACCEPTANCE CRITERIA
- dotnet build ArchLucid.Backend.slnf succeeds.
- Existing ArchLucid.Worker.Tests and ArchLucid.Api.Tests pass without modification.
- Starting the application with OrchestratorBackend = Legacy resolves AuthorityRunOrchestratorApplicationAdapter.
- Starting the application with OrchestratorBackend = DurableTask resolves DtfAuthorityRunOrchestrator.
  (Verify via a new composition smoke test or by inspecting logs at startup.)
```

---

## P26-7 — Parity Integration Tests (Legacy vs DurableTask)

```
Write behavior-equivalence integration tests that run the same authority pipeline request through
both the Legacy and the DurableTask backends and assert identical observable outputs. These tests
act as the gating condition before the legacy path can be removed.

TARGET PROJECT
ArchLucid.AgentRuntime.Tests (the existing integration test project with real-service wiring).
Look at RealRuntimeMixedModeTests.cs and RealAzureOpenAIEndToEndTests.cs for the host construction
pattern.

TEST CLASS
Create ArchLucid.AgentRuntime.Tests/AuthorityPipelineOrchestratorParityTests.cs

TESTS TO WRITE (all marked [SkippableFact] and skipped unless environment variable
ARCHLUCID_PARITY_TESTS_ENABLED=true is set, to avoid CI noise before DTF schema is provisioned)

1. ExecuteAsync_LegacyAndDtf_ProduceIdenticalManifestOutput
   - Build two in-process hosts: one with OrchestratorBackend=Legacy, one with OrchestratorBackend=DurableTask.
   - Both hosts share the same in-memory or test SQL store (use LocalDb or SQLite-compatible
     Microsoft.DurableTask.SqlServer if available; otherwise document skip condition).
   - Submit the same ContextIngestionRequest to both.
   - Assert: run.GoldenManifestId is not null in both results.
   - Assert: manifest content (component count, finding count, decision count) is equal between both.

2. ExecuteAsync_LegacyAndDtf_EmitIdenticalAuditEventTypes
   - Use the same two-host setup.
   - Capture all AuditEvent.EventType values recorded during each run.
   - Assert: the multiset of event types is identical (same types, same occurrence counts).
   - Reference AUDIT_COVERAGE_MATRIX.md — the minimum required types are
     AuthorityRunStarted and AuthorityRunCompleted.

3. CompleteQueuedAuthorityPipelineAsync_Dtf_ResumesSuccessfully
   - Submit a request with async queueing enabled to the DurableTask host.
   - Invoke CompleteQueuedAuthorityPipelineAsync with the same RunId.
   - Assert: final RunRecord has ContextSnapshotId populated.

HELPER
Add a private static IHost BuildOrchestrationTestHost(OrchestratorBackend backend) method that
constructs a minimal host using InMemoryStorageProviderRegistrar (for the Legacy path) or
SqlStorageProviderRegistrar with a LocalDb/SQLite connection (for the DurableTask path) and sets
the AuthorityPipeline:OrchestratorBackend option accordingly.

CONSTRAINTS
- Do not use ConfigureAwait(false) in test methods (project rule).
- Tests must be additive — do not modify existing test classes.
- The test class must carry [Trait("Category", "Integration")] and [Trait("Suite", "Parity")].

ACCEPTANCE CRITERIA
- dotnet test --filter "Suite=Parity" passes when ARCHLUCID_PARITY_TESTS_ENABLED=true.
- Tests are skipped (not failing) when the environment variable is absent.
```

---

## P26-8 — Architecture Test: No DTF Namespace Leakage

```
Add an architecture unit test to ArchLucid.Architecture.Tests that verifies no Microsoft.DurableTask.*
type reference appears in ArchLucid.Application or ArchLucid.Contracts assemblies. This enforces
the interface boundary mandated by improvement #26.

TARGET FILE
ArchLucid.Architecture.Tests/DtfNamespaceBoundaryArchitectureTests.cs  (new file)

TEST CLASS STRUCTURE
Follow the same pattern as AuditPathClassificationArchitectureTests.cs — read source files with
Roslyn, walk using directives and type references.

TEST: DtfTypes_DoNotLeakIntoApplicationOrContracts
1. Collect all .cs files under the following relative roots (same discovery method as existing
   architecture tests):
   - ArchLucid.Application/
   - ArchLucid.Contracts/

2. For each file, parse the syntax tree with CSharpSyntaxTree.ParseText.

3. Walk UsingDirectiveSyntax nodes and all fully-qualified type references.

4. Assert that no node's string representation starts with "Microsoft.DurableTask".

5. On failure, report the file path and offending type name in the assertion message so it is
   actionable.

TRAIT
[Trait("Category", "Architecture")]
[Trait("Suite", "Core")]

WHY THIS TEST
The architecture invariant states: "DTF types (TaskOrchestrationContext, TaskActivity, etc.) must
NOT appear in ArchLucid.Application or ArchLucid.Contracts." This test makes that invariant
machine-verifiable and CI-enforced.

CONSTRAINTS
- Do not modify any existing architecture test.
- Use the same FluentAssertions + Roslyn pattern already in the project.
- The test must pass immediately after P26-4 is completed (no DTF types should have leaked).

ACCEPTANCE CRITERIA
- Test class compiles and the single test passes (green).
- Introducing a Microsoft.DurableTask using in ArchLucid.Application causes the test to fail.
```

---

## P26-9 — Release Smoke Verification with DurableTask Backend Active

```
Validate that the full end-to-end release smoke run passes with OrchestratorBackend = DurableTask
active, satisfying the final acceptance criterion of improvement #26 before the legacy path can
be retired.

STEPS

1. Set the environment variable (or appsettings.Development.json override):
   ArchLucid__AuthorityPipeline__OrchestratorBackend=DurableTask

2. Ensure a SQL Server database is available (LocalDb or dev instance). The DTF SQL backend will
   auto-create its schema tables on first start.

3. Run the release smoke script:
   ./release-smoke.ps1
   (or release-smoke.cmd on Windows without PowerShell)

4. Verify the following in the output / logs:
   a. At least one authority pipeline run completes end-to-end (RunId appears in logs with state
      transitions: run_persisted → inline_authority_pipeline_stages or DTF equivalent).
   b. AuditEvent types AuthorityRunStarted and AuthorityRunCompleted are both emitted.
   c. GoldenManifestId is non-null on the returned RunRecord.
   d. No unhandled exceptions referencing DurableTask types appear in ArchLucid.Application or
      ArchLucid.Contracts namespaces.

5. Confirm parity test suite (P26-7) also passes in this environment:
   dotnet test --filter "Suite=Parity" (with ARCHLUCID_PARITY_TESTS_ENABLED=true)

ACCEPTANCE CRITERIA
All five acceptance criteria from improvement #26 in LATEST.md are met:
1. All existing AuthorityRunOrchestrator unit and integration tests pass.
2. Parity tests confirm identical manifest output between Legacy and DurableTask backends.
3. release-smoke.ps1 completes end-to-end with DurableTask backend active.
4. No DTF types in ArchLucid.Application or ArchLucid.Contracts (verified by P26-8 architecture test).
5. Audit event coverage is unchanged or improved (verify against docs/library/AUDIT_COVERAGE_MATRIX.md).

Document the smoke run result (pass/fail + date) in a brief comment appended to the improvement #26
entry in docs/assessments/LATEST.md.
```

---

## P26-10 — Remove Legacy Orchestrator Path

> **Gate:** Run this prompt only after P26-9 passes fully (smoke run green, parity tests green,
> architecture test green). Do not run speculatively.

```
Remove the legacy AuthorityRunOrchestrator path from production DI wiring now that the Durable Task
Framework backend has been validated end-to-end. The class itself is NOT deleted yet — it must remain
for the existing unit tests in ArchLucid.Persistence.Tests — but it is no longer registered as the
default implementation and the feature-flag selection collapses.

CHANGES

1. ArchLucid.Host.Composition/Configuration/SqlStorageProviderRegistrar.cs
   - Remove the OrchestratorBackend switch factory registration added in P26-6.
   - Replace with a direct scoped registration:
       services.AddScoped<IAuthorityRunOrchestrator, DtfAuthorityRunOrchestrator>();
   - Remove the AuthorityRunOrchestrator and AuthorityRunOrchestratorApplicationAdapter scoped
     registrations from this file (they are no longer used at runtime).
   - Add a comment: "Legacy AuthorityRunOrchestrator retained in ArchLucid.Persistence for
     ArchLucid.Persistence.Tests; not registered in production DI since DTF parity confirmed."

2. ArchLucid.Host.Composition/Configuration/InMemoryStorageProviderRegistrar.cs
   - Leave unchanged (InMemory path stays on Legacy for simulator/agent test runs).

3. ArchLucid.Core/Authority/AuthorityPipelineOptions.cs
   - Keep OrchestratorBackend property (it still controls DTF vs Legacy in InMemory/test hosts).
   - Update the XML summary to note Legacy is no longer the production default.

4. docs/assessments/LATEST.md
   - Mark improvement #26 as complete with the date.

CONSTRAINTS
- Do not delete AuthorityRunOrchestrator.cs or its unit tests.
- Do not delete AuthorityRunOrchestratorApplicationAdapter.cs — it is still used by InMemory.
- Do not delete FakeAuthorityRunOrchestrator.cs.
- Run the full test suite after these changes: dotnet test ArchLucid.sln

ACCEPTANCE CRITERIA
- dotnet test ArchLucid.sln passes (all suites: Unit, Integration, Architecture, Parity).
- The SQL production host resolves DtfAuthorityRunOrchestrator for IAuthorityRunOrchestrator.
- The InMemory host still resolves AuthorityRunOrchestratorApplicationAdapter (for agent simulator
  and integration test hosts that do not provision a SQL DTF schema).
```
