using System.Diagnostics;
using System.Diagnostics.Metrics;

using ArchLucid.Core.Evidence;
using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.AgentRuntime.Tests.TestSupport;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RealAgentExecutorStagedCriticTests
{
    private static readonly string AgentExecutionActivitySourceName = ArchLucidMeterNames.AgentExecutionActivitySource;

    private static ArchitectureRequest MinimalRequest()
    {
        return new ArchitectureRequest
        {
            RequestId = "r1",
            Description = "1234567890ab",
            SystemName = "S",
            Environment = "prod"
        };
    }

    private static AgentTask[] CreateStandardBatchTasks()
    {
        string runId = Guid.NewGuid().ToString("N");

        return
        [
            new AgentTask
            {
                TaskId = "tz",
                RunId = runId,
                AgentType = AgentType.Topology
            },
            new AgentTask
            {
                TaskId = "tc",
                RunId = runId,
                AgentType = AgentType.Compliance
            },
            new AgentTask
            {
                TaskId = "tk",
                RunId = runId,
                AgentType = AgentType.Critic
            }
        ];
    }

    private static RealAgentExecutor CreateSut(
        IOptions<StagedCriticAgentOptions> stagedOptions,
        ITechnologyLedgerRepository? technologyLedgerRepository,
        AgentOutputQualityGateOptions? qualityGateOptions,
        params IAgentHandler[] handlers)
    {
        IOptions<AgentExecutionResilienceOptions> ro = Options.Create(
            new AgentExecutionResilienceOptions { MaxConcurrentHandlers = 0, PerHandlerTimeoutSeconds = 0 });

        return new RealAgentExecutor(
            handlers,
            NullLogger<RealAgentExecutor>.Instance,
            new StubPromptMonitor(new AgentPromptCatalogOptions()),
            new FixedScopeProvider(),
            new AgentHandlerConcurrencyGate(ro),
            ro,
            stagedOptions,
            Options.Create(qualityGateOptions ?? new AgentOutputQualityGateOptions()),
            new NoOpPromptRedactor(),
            new FixedValueOptionsMonitor<ArchLucidLlmOptions>(new ArchLucidLlmOptions()),
            new InMemoryAgentResultRepository(new InMemoryAgentResultEnrichmentRepository()),
            new NoOpAgentExecutionTraceRecorder(),
            technologyLedgerRepository ?? TopologyAgentHandlerTestFactory.CreateEmptyLedgerRepository(),
            RealAgentExecutorTestHosting.DevelopmentEnvironment,
            RealAgentExecutorTestHosting.EmptyConfiguration,
            new FixedValueOptionsMonitor<AgentExecutionOptions>(new AgentExecutionOptions { Mode = "Real" }));
    }

    private static RealAgentExecutor CreateSut(
        IOptions<StagedCriticAgentOptions> stagedOptions,
        AgentOutputQualityGateOptions qualityGateOptions,
        params IAgentHandler[] handlers) =>
        CreateSut(stagedOptions, null, qualityGateOptions, handlers);

    private static RealAgentExecutor CreateSut(
        IOptions<StagedCriticAgentOptions> stagedOptions,
        ITechnologyLedgerRepository? technologyLedgerRepository,
        params IAgentHandler[] handlers) =>
        CreateSut(stagedOptions, technologyLedgerRepository, null, handlers);

    private static RealAgentExecutor CreateSut(
        IOptions<StagedCriticAgentOptions> stagedOptions,
        params IAgentHandler[] handlers) =>
        CreateSut(stagedOptions, technologyLedgerRepository: null, qualityGateOptions: null, handlers);

    [SkippableFact]
    public async Task StagedCriticEnabled_true_delays_critic_until_phase1_complete()
    {
        int phase1Finished = 0;
        IAgentHandler topo = new SignalAfterDelayHandler(AgentType.Topology, 120, () => Interlocked.Increment(ref phase1Finished));
        IAgentHandler comp = new SignalAfterDelayHandler(AgentType.Compliance, 120, () => Interlocked.Increment(ref phase1Finished));
        ObservingCriticHandler critic = new(() => Volatile.Read(ref phase1Finished));

        RealAgentExecutor sut = CreateSut(
            Options.Create(new StagedCriticAgentOptions { StagedCriticEnabled = true }),
            topo,
            comp,
            critic);

        ArchitectureRequest request = MinimalRequest();
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask tTopo = new()
        {
            TaskId = "tz",
            RunId = runId,
            AgentType = AgentType.Topology
        };
        AgentTask tComp = new()
        {
            TaskId = "tc",
            RunId = runId,
            AgentType = AgentType.Compliance
        };
        AgentTask tCrit = new()
        {
            TaskId = "tk",
            RunId = runId,
            AgentType = AgentType.Critic
        };

        await sut.ExecuteAsync(runId, request, evidence, [tTopo, tComp, tCrit], CancellationToken.None);

        critic.ObservedPhase1FinishedAtCriticStart.Should().Be(2);
    }

    [SkippableFact]
    public async Task StagedCriticOverlapEnabled_true_allows_critic_to_start_before_phase1_complete()
    {
        int phase1Finished = 0;
        IAgentHandler topo = new SignalAfterDelayHandler(AgentType.Topology, 200, () => Interlocked.Increment(ref phase1Finished));
        IAgentHandler comp = new SignalAfterDelayHandler(AgentType.Compliance, 200, () => Interlocked.Increment(ref phase1Finished));
        ObservingCriticHandler critic = new(() => Volatile.Read(ref phase1Finished));

        RealAgentExecutor sut = CreateSut(
            Options.Create(new StagedCriticAgentOptions
            {
                StagedCriticEnabled = true,
                StagedCriticOverlapEnabled = true,
            }),
            new AgentOutputQualityGateOptions
            {
                Enabled = true,
                Mode = AgentOutputQualityGateMode.WarnOnly,
            },
            topo,
            comp,
            critic);

        ArchitectureRequest request = MinimalRequest();
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask tTopo = new()
        {
            TaskId = "tz",
            RunId = runId,
            AgentType = AgentType.Topology
        };
        AgentTask tComp = new()
        {
            TaskId = "tc",
            RunId = runId,
            AgentType = AgentType.Compliance
        };
        AgentTask tCrit = new()
        {
            TaskId = "tk",
            RunId = runId,
            AgentType = AgentType.Critic
        };

        await sut.ExecuteAsync(runId, request, evidence, [tTopo, tComp, tCrit], CancellationToken.None);

        critic.ObservedPhase1FinishedAtCriticStart.Should().BeLessThan(2);
        evidence.Notes.Should().Contain(n =>
            EvidenceNoteTypes.StagedCriticOverlapApplied.Equals(n.NoteType, StringComparison.Ordinal));
        evidence.Notes.Should().Contain(n =>
            EvidenceNoteTypes.StagedPriorAgentsSummary.Equals(n.NoteType, StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task StagedCriticOverlapEnabled_true_falls_back_to_serial_under_pilot_strict_enforce()
    {
        int phase1Finished = 0;
        IAgentHandler topo = new SignalAfterDelayHandler(AgentType.Topology, 120, () => Interlocked.Increment(ref phase1Finished));
        IAgentHandler comp = new SignalAfterDelayHandler(AgentType.Compliance, 120, () => Interlocked.Increment(ref phase1Finished));
        ObservingCriticHandler critic = new(() => Volatile.Read(ref phase1Finished));

        RealAgentExecutor sut = CreateSut(
            Options.Create(new StagedCriticAgentOptions
            {
                StagedCriticEnabled = true,
                StagedCriticOverlapEnabled = true,
            }),
            new AgentOutputQualityGateOptions
            {
                Enabled = true,
                Mode = AgentOutputQualityGateMode.PilotStrict,
                EnforceOnReject = true,
                PilotStrictMinAgentResultFaithfulnessSupportRatio = 0.5,
                PilotStrictMinFaithfulnessSupportRatio = 0.5,
                PilotStrictMinEvidenceRefCount = 2,
            },
            topo,
            comp,
            critic);

        ArchitectureRequest request = MinimalRequest();
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask tTopo = new()
        {
            TaskId = "tz",
            RunId = runId,
            AgentType = AgentType.Topology
        };
        AgentTask tComp = new()
        {
            TaskId = "tc",
            RunId = runId,
            AgentType = AgentType.Compliance
        };
        AgentTask tCrit = new()
        {
            TaskId = "tk",
            RunId = runId,
            AgentType = AgentType.Critic
        };

        await sut.ExecuteAsync(runId, request, evidence, [tTopo, tComp, tCrit], CancellationToken.None);

        critic.ObservedPhase1FinishedAtCriticStart.Should().Be(2);
        evidence.Notes.Should().NotContain(n =>
            EvidenceNoteTypes.StagedCriticOverlapApplied.Equals(n.NoteType, StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task StagedCriticOverlapEnabled_true_reduces_wall_clock_versus_serial_when_critic_is_slower()
    {
        IAgentHandler topo = new SignalAfterDelayHandler(AgentType.Topology, 50, static () => { });
        IAgentHandler comp = new SignalAfterDelayHandler(AgentType.Compliance, 50, static () => { });
        IAgentHandler slowCritic = new SignalAfterDelayHandler(AgentType.Critic, 200, static () => { });

        RealAgentExecutor overlapSut = CreateSut(
            Options.Create(new StagedCriticAgentOptions
            {
                StagedCriticEnabled = true,
                StagedCriticOverlapEnabled = true,
            }),
            new AgentOutputQualityGateOptions { Mode = AgentOutputQualityGateMode.WarnOnly },
            topo,
            comp,
            slowCritic);

        RealAgentExecutor serialSut = CreateSut(
            Options.Create(new StagedCriticAgentOptions
            {
                StagedCriticEnabled = true,
                StagedCriticOverlapEnabled = false,
            }),
            new AgentOutputQualityGateOptions { Mode = AgentOutputQualityGateMode.WarnOnly },
            topo,
            comp,
            slowCritic);

        ArchitectureRequest request = MinimalRequest();
        Stopwatch overlapWatch = Stopwatch.StartNew();
        await overlapSut.ExecuteAsync(
            Guid.NewGuid().ToString("N"),
            request,
            new AgentEvidencePackage(),
            CreateStandardBatchTasks(),
            CancellationToken.None);
        overlapWatch.Stop();

        Stopwatch serialWatch = Stopwatch.StartNew();
        await serialSut.ExecuteAsync(
            Guid.NewGuid().ToString("N"),
            request,
            new AgentEvidencePackage(),
            CreateStandardBatchTasks(),
            CancellationToken.None);
        serialWatch.Stop();

        overlapWatch.ElapsedMilliseconds.Should().BeLessThan(serialWatch.ElapsedMilliseconds);
    }

    [Fact]
    public async Task StagedCriticTimeout_skips_critic_and_records_evidence_note()
    {
        IAgentHandler topo = new SimpleReturnHandler(AgentType.Topology, "topo-claim", "res-topo");
        IAgentHandler slowCritic = new SignalAfterDelayHandler(AgentType.Critic, 5000, static () => { });

        RealAgentExecutor sut = CreateSut(
            Options.Create(new StagedCriticAgentOptions { StagedCriticEnabled = true, CriticTimeoutSeconds = 1 }),
            topo,
            slowCritic);

        ArchitectureRequest request = MinimalRequest();
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask tTopo = new()
        {
            TaskId = "tz",
            RunId = runId,
            AgentType = AgentType.Topology,
        };
        AgentTask tCrit = new()
        {
            TaskId = "tk",
            RunId = runId,
            AgentType = AgentType.Critic,
        };

        IReadOnlyList<AgentResult> results = await sut.ExecuteAsync(runId, request, evidence, [tTopo, tCrit], CancellationToken.None);

        results.Should().HaveCount(2);
        results.Single(r => r.AgentType == AgentType.Critic).Confidence.Should().Be(0);
        evidence.Notes.Should().Contain(n =>
            string.Equals(n.NoteType, EvidenceNoteTypes.CriticTimeout, StringComparison.Ordinal));
    }

    [SkippableFact]
    public async Task StagedCriticEnabled_true_emits_open_telemetry_phase_spans_and_claim_count_tag()
    {
        List<Activity> completed = [];
        string runId = Guid.NewGuid().ToString("N");

        using (ActivityListener listener = new())
        {
            listener.ShouldListenTo = s => s.Name == AgentExecutionActivitySourceName;
            listener.Sample = (ref _) => ActivitySamplingResult.AllData;
            listener.ActivityStopped = completed.Add;
            ActivitySource.AddActivityListener(listener);

            IAgentHandler topo = new SimpleReturnHandler(AgentType.Topology, "topo-claim", "rid-t");
            IAgentHandler comp = new SimpleReturnHandler(AgentType.Compliance, "comp-claim", "rid-c");
            IAgentHandler critic = new ObservingCriticHandler(() => 0);

            RealAgentExecutor sut = CreateSut(
                Options.Create(new StagedCriticAgentOptions { StagedCriticEnabled = true }),
                topo,
                comp,
                critic);

            ArchitectureRequest request = MinimalRequest();
            AgentEvidencePackage evidence = new();
            AgentTask tTopo = new()
            {
                TaskId = "tz",
                RunId = runId,
                AgentType = AgentType.Topology
            };
            AgentTask tComp = new()
            {
                TaskId = "tc",
                RunId = runId,
                AgentType = AgentType.Compliance
            };
            AgentTask tCrit = new()
            {
                TaskId = "tk",
                RunId = runId,
                AgentType = AgentType.Critic
            };

            await sut.ExecuteAsync(runId, request, evidence, [tTopo, tComp, tCrit], CancellationToken.None);
        }

        Activity[] phases = completed
            .Where(a => a.OperationName is "AgentExecution.Phase1" or "AgentExecution.Phase2_Critic")
            .ToArray();

        phases.Should().HaveCount(2);
        phases[0].OperationName.Should().Be("AgentExecution.Phase1");
        phases[1].OperationName.Should().Be("AgentExecution.Phase2_Critic");
        phases[0].GetTagItem("archlucid.run_id").Should().Be(runId);
        phases[1].GetTagItem("archlucid.run_id").Should().Be(runId);
        object? claimsTag = phases[1].GetTagItem("archlucid.staged_critic.summarized_claims_count");
        claimsTag.Should().NotBeNull();
        Convert.ToInt32(claimsTag).Should().Be(2);
        phases[0].GetTagItem("archlucid.staged_critic.phase_duration_ms").Should().NotBeNull();
        phases[1].GetTagItem("archlucid.staged_critic.phase_duration_ms").Should().NotBeNull();
        Convert.ToDouble(phases[0].GetTagItem("archlucid.staged_critic.phase_duration_ms")).Should().BeGreaterOrEqualTo(0);
        Convert.ToDouble(phases[1].GetTagItem("archlucid.staged_critic.phase_duration_ms")).Should().BeGreaterOrEqualTo(0);
    }

    [SkippableFact]
    public async Task StagedCriticEnabled_true_records_phase_duration_histogram()
    {
        using StagedCriticPhaseDurationCapture capture = StagedCriticPhaseDurationCapture.Start();
        string runId = Guid.NewGuid().ToString("N");
        IAgentHandler topo = new SimpleReturnHandler(AgentType.Topology, "topo-claim", "rid-t");
        IAgentHandler critic = new SimpleReturnHandler(AgentType.Critic, "crit-claim", "rid-k");
        RealAgentExecutor sut = CreateSut(
            Options.Create(new StagedCriticAgentOptions { StagedCriticEnabled = true }),
            topo,
            critic);
        ArchitectureRequest request = MinimalRequest();
        AgentEvidencePackage evidence = new();
        AgentTask tTopo = new()
        {
            TaskId = "tz",
            RunId = runId,
            AgentType = AgentType.Topology
        };
        AgentTask tCrit = new()
        {
            TaskId = "tk",
            RunId = runId,
            AgentType = AgentType.Critic
        };

        await sut.ExecuteAsync(runId, request, evidence, [tTopo, tCrit], CancellationToken.None);

        IReadOnlyList<StagedCriticPhaseDurationCapture.Measurement> measurements =
            capture.MeasurementsFor("archlucid_agent_execution_staged_critic_phase_duration_ms");

        measurements.Should().HaveCount(2);
        measurements.Select(static measurement => measurement.Phase).Should().BeEquivalentTo(["phase1", "phase2"]);
        measurements.Should().OnlyContain(static measurement => measurement.ValueMilliseconds >= 0);
    }

    [SkippableFact]
    public async Task StagedCriticEnabled_false_allows_critic_to_start_before_phase1_signals_complete()
    {
        int phase1Finished = 0;
        IAgentHandler topo = new SignalAfterDelayHandler(AgentType.Topology, 200, () => Interlocked.Increment(ref phase1Finished));
        IAgentHandler comp = new SignalAfterDelayHandler(AgentType.Compliance, 200, () => Interlocked.Increment(ref phase1Finished));
        ObservingCriticHandler critic = new(() => Volatile.Read(ref phase1Finished));

        RealAgentExecutor sut = CreateSut(
            Options.Create(new StagedCriticAgentOptions { StagedCriticEnabled = false }),
            topo,
            comp,
            critic);

        ArchitectureRequest request = MinimalRequest();
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask tTopo = new()
        {
            TaskId = "tz",
            RunId = runId,
            AgentType = AgentType.Topology
        };
        AgentTask tComp = new()
        {
            TaskId = "tc",
            RunId = runId,
            AgentType = AgentType.Compliance
        };
        AgentTask tCrit = new()
        {
            TaskId = "tk",
            RunId = runId,
            AgentType = AgentType.Critic
        };

        await sut.ExecuteAsync(runId, request, evidence, [tTopo, tComp, tCrit], CancellationToken.None);

        critic.ObservedPhase1FinishedAtCriticStart.Should().BeLessThan(2);
    }

    [SkippableFact]
    public async Task StagedCriticEnabled_true_appends_summary_evidence_note()
    {
        IAgentHandler topo = new SimpleReturnHandler(AgentType.Topology, "topo-claim", "rid-t");
        IAgentHandler comp = new SimpleReturnHandler(AgentType.Compliance, "comp-claim", "rid-c");
        IAgentHandler critic = new ObservingCriticHandler(() => 0);

        RealAgentExecutor sut = CreateSut(
            Options.Create(new StagedCriticAgentOptions { StagedCriticEnabled = true }),
            topo,
            comp,
            critic);

        ArchitectureRequest request = MinimalRequest();
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask tTopo = new()
        {
            TaskId = "tz",
            RunId = runId,
            AgentType = AgentType.Topology
        };
        AgentTask tComp = new()
        {
            TaskId = "tc",
            RunId = runId,
            AgentType = AgentType.Compliance
        };
        AgentTask tCrit = new()
        {
            TaskId = "tk",
            RunId = runId,
            AgentType = AgentType.Critic
        };

        await sut.ExecuteAsync(runId, request, evidence, [tTopo, tComp, tCrit], CancellationToken.None);

        EvidenceNote? note = evidence.Notes.LastOrDefault(n =>
            EvidenceNoteTypes.StagedPriorAgentsSummary.Equals(n.NoteType, StringComparison.Ordinal));

        note.Should().NotBeNull();
        note.Message.Should().Contain("Topology");
        note.Message.Should().Contain("Compliance");
        note.Message.Should().Contain("topo-claim");
    }

    [SkippableFact]
    public async Task StagedCriticEnabled_true_includes_ledger_snapshot_in_summary_note_when_repository_returns_rows()
    {
        IAgentHandler topo = new SimpleReturnHandler(AgentType.Topology, "topo-claim", "rid-t");
        IAgentHandler critic = new ObservingCriticHandler(() => 0);
        ScopeContext scope = new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject,
        };
        string runId = Guid.NewGuid().ToString("N");
        ITechnologyLedgerRepository ledgerRepository = ComplianceAgentHandlerTestDependencies.CreateTechnologyLedgerRepository(
            scope,
            runId,
            [
                new TechnologyLedgerEntry
                {
                    RunId = runId,
                    Role = TechnologyLedgerRole.CloudPlatform,
                    TechnologyName = "Microsoft Azure",
                    ProviderFamily = CloudProvider.Azure,
                    Status = TechnologyLedgerStatus.Chosen,
                    Source = TechnologyLedgerSource.User,
                    CreatedUtc = DateTime.UtcNow,
                    UpdatedUtc = DateTime.UtcNow,
                },
            ]);

        RealAgentExecutor sut = CreateSut(
            Options.Create(new StagedCriticAgentOptions { StagedCriticEnabled = true }),
            ledgerRepository,
            topo,
            critic);

        ArchitectureRequest request = MinimalRequest();
        AgentEvidencePackage evidence = new();
        AgentTask tTopo = new() { TaskId = "tz", RunId = runId, AgentType = AgentType.Topology };
        AgentTask tCrit = new() { TaskId = "tk", RunId = runId, AgentType = AgentType.Critic };

        await sut.ExecuteAsync(runId, request, evidence, [tTopo, tCrit], CancellationToken.None);

        EvidenceNote? note = evidence.Notes.LastOrDefault(n =>
            EvidenceNoteTypes.StagedPriorAgentsSummary.Equals(n.NoteType, StringComparison.Ordinal));

        note.Should().NotBeNull();
        note!.Message.Should().Contain("## Technology Ledger (snapshot at staged Critic boundary)");
        note.Message.Should().Contain("CloudPlatform");
    }

    [SkippableFact]
    public async Task StagedCriticEnabled_false_does_not_add_staged_summary_note()
    {
        IAgentHandler topo = new SimpleReturnHandler(AgentType.Topology, "topo-claim", "rid-t");
        IAgentHandler comp = new SimpleReturnHandler(AgentType.Compliance, "comp-claim", "rid-c");
        IAgentHandler critic = new ObservingCriticHandler(() => 0);

        RealAgentExecutor sut = CreateSut(
            Options.Create(new StagedCriticAgentOptions { StagedCriticEnabled = false }),
            topo,
            comp,
            critic);

        ArchitectureRequest request = MinimalRequest();
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask tTopo = new()
        {
            TaskId = "tz",
            RunId = runId,
            AgentType = AgentType.Topology
        };
        AgentTask tComp = new()
        {
            TaskId = "tc",
            RunId = runId,
            AgentType = AgentType.Compliance
        };
        AgentTask tCrit = new()
        {
            TaskId = "tk",
            RunId = runId,
            AgentType = AgentType.Critic
        };

        await sut.ExecuteAsync(runId, request, evidence, [tTopo, tComp, tCrit], CancellationToken.None);

        evidence.Notes.Should().NotContain(n =>
            EvidenceNoteTypes.StagedPriorAgentsSummary.Equals(n.NoteType, StringComparison.Ordinal));
    }

    private sealed class StubPromptMonitor(AgentPromptCatalogOptions value) : IOptionsMonitor<AgentPromptCatalogOptions>
    {
        public AgentPromptCatalogOptions CurrentValue
        {
            get;
        } = value;

        public AgentPromptCatalogOptions Get(string? name)
        {
            return CurrentValue;
        }

        public IDisposable? OnChange(Action<AgentPromptCatalogOptions, string?> listener)
        {
            return null;
        }
    }

    private sealed class FixedScopeProvider : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope()
        {
            return new ScopeContext
            {
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject
            };
        }
    }

    private sealed class SignalAfterDelayHandler(AgentType agentType, int delayMs, Action onComplete) : IAgentHandler
    {
        public AgentType AgentType => agentType;

        public string AgentTypeKey => AgentTypeKeys.FromEnum(agentType);

        public async Task<AgentResult> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            AgentTask task,
            CancellationToken cancellationToken = default)
        {
            await Task.Delay(delayMs, cancellationToken);

            onComplete();

            return new AgentResult
            {
                RunId = runId,
                TaskId = task.TaskId,
                AgentType = agentType,
                ResultId = $"res-{task.TaskId}",
                Claims = [],
                EvidenceRefs = []
            };
        }
    }

    private sealed class SimpleReturnHandler(AgentType agentType, string claim, string resultId) : IAgentHandler
    {
        public AgentType AgentType => agentType;

        public string AgentTypeKey => AgentTypeKeys.FromEnum(agentType);

        public Task<AgentResult> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            AgentTask task,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(
                new AgentResult
                {
                    RunId = runId,
                    TaskId = task.TaskId,
                    AgentType = agentType,
                    ResultId = resultId,
                    Confidence = 0.8,
                    Claims = [claim],
                    EvidenceRefs = ["ev1"]
                });
        }
    }

    private sealed class ObservingCriticHandler(Func<int> readPhase1FinishedCount) : IAgentHandler
    {
        public int ObservedPhase1FinishedAtCriticStart
        {
            get;
            private set;
        }

        public AgentType AgentType => AgentType.Critic;

        public string AgentTypeKey => AgentTypeKeys.Critic;

        public Task<AgentResult> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            AgentTask task,
            CancellationToken cancellationToken = default)
        {
            ObservedPhase1FinishedAtCriticStart = readPhase1FinishedCount();

            return Task.FromResult(
                new AgentResult
                {
                    RunId = runId,
                    TaskId = task.TaskId,
                    AgentType = AgentType.Critic,
                    ResultId = "critic-rid",
                    Claims = [],
                    EvidenceRefs = []
                });
        }
    }

    private sealed class StagedCriticPhaseDurationCapture : IDisposable
    {
        private readonly MeterListener _listener = new();
        private readonly List<Measurement> _measurements = [];

        private StagedCriticPhaseDurationCapture()
        {
            _listener.InstrumentPublished = OnInstrumentPublished;
            _listener.SetMeasurementEventCallback<double>(OnMeasurementDouble);
            _listener.Start();
        }

        public void Dispose()
        {
            _listener.Dispose();
        }

        public static StagedCriticPhaseDurationCapture Start()
        {
            return new StagedCriticPhaseDurationCapture();
        }

        public IReadOnlyList<Measurement> MeasurementsFor(string instrumentName)
        {
            return _measurements.Where(measurement => measurement.Name == instrumentName).ToList();
        }

        private void OnInstrumentPublished(Instrument instrument, MeterListener meterListener)
        {
            if (instrument.Meter.Name != ArchLucidMeterNames.Meter)
                return;

            if (instrument.Name == "archlucid_agent_execution_staged_critic_phase_duration_ms")
                meterListener.EnableMeasurementEvents(instrument);
        }

        private void OnMeasurementDouble(
            Instrument instrument,
            double measurement,
            ReadOnlySpan<KeyValuePair<string, object?>> tags,
            object? state)
        {
            _ = state;
            string? phase = null;

            foreach (KeyValuePair<string, object?> tag in tags)
            {
                if (tag.Key == "phase")
                    phase = tag.Value?.ToString();
            }

            _measurements.Add(new Measurement(instrument.Name, phase ?? string.Empty, measurement));
        }

        internal sealed record Measurement(string Name, string Phase, double ValueMilliseconds);
    }
}
