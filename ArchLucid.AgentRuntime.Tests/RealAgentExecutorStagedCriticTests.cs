using System.Diagnostics;

using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RealAgentExecutorStagedCriticTests
{
    /// <summary>
    ///     Must match <c>ArchLucid.Agent.Execution</c> on <c>ArchLucidInstrumentation.AgentExecution</c>. Use this literal
    ///     in <see cref="ActivityListener.ShouldListenTo" /> — reading <c>AgentExecution.Name</c> while static init builds
    ///     earlier <see cref="ActivitySource" /> instances can throw (listener callback during type initializer).
    /// </summary>
    private const string AgentExecutionActivitySourceName = "ArchLucid.Agent.Execution";

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

    private static RealAgentExecutor CreateSut(
        IOptions<StagedCriticAgentOptions> stagedOptions,
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
            Options.Create(new AgentOutputQualityGateOptions()),
            new NoOpPromptRedactor(),
            new FixedValueOptionsMonitor<ArchLucidLlmOptions>(new ArchLucidLlmOptions()));
    }

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
}
