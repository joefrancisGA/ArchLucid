using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;

using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;

using ArchLucid.AgentRuntime.Tests.Support;

using FluentAssertions;
using FluentAssertions.Specialized;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RealAgentExecutorTests
{
    /// <summary>
    ///     Literal source name for <see cref="ActivityListener.ShouldListenTo" /> � do not read
    ///     <see cref="ArchLucidInstrumentation.AgentHandler" /> during listener registration (type-init cycle).
    /// </summary>
    private static readonly string AgentHandlerActivitySourceName = ArchLucidMeterNames.AgentHandlerActivitySource;

    private static IOptions<AgentExecutionResilienceOptions> UnlimitedResilienceOptions()
    {
        return Options.Create(
            new AgentExecutionResilienceOptions { MaxConcurrentHandlers = 0, PerHandlerTimeoutSeconds = 0 });
    }

    private static RealAgentExecutor CreateSut(params IAgentHandler[] handlers) =>
        CreateSut(
            new NoOpPromptRedactor(),
            new FixedValueOptionsMonitor<ArchLucidLlmOptions>(new ArchLucidLlmOptions()),
            handlers);

    private static RealAgentExecutor CreateSut(
        IPromptRedactor promptRedactor,
        IOptionsMonitor<ArchLucidLlmOptions> archLucidLlm,
        params IAgentHandler[] handlers)
    {
        IOptions<AgentExecutionResilienceOptions> ro = UnlimitedResilienceOptions();

        return new RealAgentExecutor(
            handlers,
            NullLogger<RealAgentExecutor>.Instance,
            new StubPromptMonitor(new AgentPromptCatalogOptions()),
            new FixedScopeProvider(
                new ScopeContext
                {
                    TenantId = ScopeIds.DefaultTenant,
                    WorkspaceId = ScopeIds.DefaultWorkspace,
                    ProjectId = ScopeIds.DefaultProject
                }),
            new AgentHandlerConcurrencyGate(ro),
            ro,
            Options.Create(new StagedCriticAgentOptions()),
            Options.Create(new AgentOutputQualityGateOptions()),
            promptRedactor,
            archLucidLlm);
    }

    [SkippableFact]
    public void Constructor_when_duplicate_agent_types_throws()
    {
        IAgentHandler[] handlers =
        [
            new StubAgentHandler(AgentType.Topology),
            new StubAgentHandler(AgentType.Topology)
        ];

        Action act = () => _ = CreateSut(handlers);

        act.Should().Throw<ArgumentException>();
    }

    [SkippableFact]
    public async Task ExecuteAsync_orders_results_by_agent_type_regardless_of_completion_order()
    {
        List<AgentType> observed = [];
        IAgentHandler topology = new OrderingStubHandler(AgentType.Topology, observed);
        IAgentHandler compliance = new OrderingStubHandler(AgentType.Compliance, observed);
        RealAgentExecutor sut = CreateSut(topology, compliance);
        ArchitectureRequest request = new()
        {
            RequestId = "r1", Description = "1234567890ab", SystemName = "S", Environment = "prod"
        };
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask taskZ = new() { TaskId = "tz", RunId = runId, AgentType = AgentType.Topology };
        AgentTask taskC = new() { TaskId = "tc", RunId = runId, AgentType = AgentType.Compliance };

        IReadOnlyList<AgentResult> results =
            await sut.ExecuteAsync(runId, request, evidence, [taskZ, taskC], CancellationToken.None);

        // Result list stays ordered by dispatch key (Compliance before Topology); handlers may finish in any order.
        observed.Should().BeEquivalentTo([AgentType.Compliance, AgentType.Topology]);
        results.Should().HaveCount(2);
        results[0].AgentType.Should().Be(AgentType.Compliance);
        results[1].AgentType.Should().Be(AgentType.Topology);
    }

    [SkippableFact]
    public async Task ExecuteAsync_when_handler_missing_throws()
    {
        RealAgentExecutor sut = CreateSut();
        ArchitectureRequest request = new() { RequestId = "r1", Description = "1234567890ab", SystemName = "S" };
        AgentTask task = new() { TaskId = "t", RunId = "run", AgentType = AgentType.Cost };

        Func<Task> act = async () =>
            await sut.ExecuteAsync("run", request, new AgentEvidencePackage(), [task], CancellationToken.None);

        ExceptionAssertions<AgentExecutionFailedException> thrown =
            await act.Should().ThrowAsync<AgentExecutionFailedException>();

        thrown.Which.InnerException.Should().BeOfType<InvalidOperationException>()
            .Which.Message.Should().Contain("cost");
    }

    [SkippableFact]
    public async Task ReasoningTrace_redacts_when_ArchLucid_Llm_flag_true_even_if_prompt_redaction_disabled()
    {
        FixedValueOptionsMonitor<LlmPromptRedactionOptions> redactionOpts = new(new LlmPromptRedactionOptions { Enabled = false });
        PromptRedactor redactor = new(redactionOpts, NullLogger<PromptRedactor>.Instance);
        FixedValueOptionsMonitor<ArchLucidLlmOptions> llmOpts = new(new ArchLucidLlmOptions { RedactReasoningTrace = true });
        IAgentHandler handler = new ProviderReasoningStubHandler(AgentType.Topology, "Reach alice@example.com for access.", null);
        RealAgentExecutor sut = CreateSut(redactor, llmOpts, handler);
        ArchitectureRequest request = new()
        {
            RequestId = "r1", Description = "1234567890ab", SystemName = "S", Environment = "prod"
        };
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = new() { TaskId = "tz", RunId = runId, AgentType = AgentType.Topology };

        IReadOnlyList<AgentResult> results = await sut.ExecuteAsync(runId, request, evidence, [task], CancellationToken.None);

        results.Should().HaveCount(1);
        results[0].ReasoningTrace.Should().NotBeNull();
        results[0].ReasoningTrace.Should().Contain("[REDACTED]");
        results[0].ReasoningTrace.Should().NotContain("alice@example.com");
    }

    [SkippableFact]
    public async Task ReasoningTrace_left_untouched_when_ArchLucid_Llm_flag_false()
    {
        FixedValueOptionsMonitor<LlmPromptRedactionOptions> redactionOpts = new(new LlmPromptRedactionOptions { Enabled = false });
        PromptRedactor redactor = new(redactionOpts, NullLogger<PromptRedactor>.Instance);
        FixedValueOptionsMonitor<ArchLucidLlmOptions> llmOpts = new(new ArchLucidLlmOptions { RedactReasoningTrace = false });
        IAgentHandler handler = new ProviderReasoningStubHandler(AgentType.Topology, "Reach alice@example.com.", null);
        RealAgentExecutor sut = CreateSut(redactor, llmOpts, handler);
        ArchitectureRequest request = new()
        {
            RequestId = "r1", Description = "1234567890ab", SystemName = "S", Environment = "prod"
        };
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = new() { TaskId = "tz", RunId = runId, AgentType = AgentType.Topology };

        IReadOnlyList<AgentResult> results = await sut.ExecuteAsync(runId, request, evidence, [task], CancellationToken.None);

        results[0].ReasoningTrace.Should().Be("Reach alice@example.com.");
    }

    [SkippableFact]
    public async Task ReasoningTrace_redacts_merged_handler_and_provider_snippets()
    {
        FixedValueOptionsMonitor<LlmPromptRedactionOptions> redactionOpts = new(new LlmPromptRedactionOptions { Enabled = true });
        PromptRedactor redactor = new(redactionOpts, NullLogger<PromptRedactor>.Instance);
        FixedValueOptionsMonitor<ArchLucidLlmOptions> llmOpts = new(new ArchLucidLlmOptions { RedactReasoningTrace = true });
        IAgentHandler handler = new ProviderReasoningStubHandler(AgentType.Topology, "backup alice@example.com", "Primary bob@example.com");
        RealAgentExecutor sut = CreateSut(redactor, llmOpts, handler);
        ArchitectureRequest request = new()
        {
            RequestId = "r1", Description = "1234567890ab", SystemName = "S", Environment = "prod"
        };
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask task = new() { TaskId = "tz", RunId = runId, AgentType = AgentType.Topology };

        IReadOnlyList<AgentResult> results = await sut.ExecuteAsync(runId, request, evidence, [task], CancellationToken.None);

        string? trace = results[0].ReasoningTrace;
        trace.Should().NotBeNull();
        trace.Should().NotContain("alice@");
        trace.Should().NotContain("bob@");
        trace.Should().Contain("[REDACTED]");
    }

    [SkippableFact]
    public async Task ExecuteAsync_records_one_activity_per_task_with_agent_tags()
    {
        // Handlers run concurrently; ActivityStopped can fire on different threads.
        ConcurrentBag<Activity> completed = [];

        using ActivityListener listener = new();
        listener.ShouldListenTo = s => s.Name == AgentHandlerActivitySourceName;
        listener.Sample = (ref _) => ActivitySamplingResult.AllData;
        listener.ActivityStopped = completed.Add;

        ActivitySource.AddActivityListener(listener);

        IAgentHandler topology = new StubAgentHandler(AgentType.Topology);
        IAgentHandler compliance = new StubAgentHandler(AgentType.Compliance);
        RealAgentExecutor sut = CreateSut(topology, compliance);
        ArchitectureRequest request = new()
        {
            RequestId = "r1", Description = "1234567890ab", SystemName = "S", Environment = "prod"
        };
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask taskZ = new() { TaskId = "tz", RunId = runId, AgentType = AgentType.Topology };
        AgentTask taskC = new() { TaskId = "tc", RunId = runId, AgentType = AgentType.Compliance };

        await sut.ExecuteAsync(runId, request, evidence, [taskZ, taskC], CancellationToken.None);

        Activity[] completedSnapshot = completed.ToArray();

        completedSnapshot.Should().HaveCount(2);
        completedSnapshot.Should().OnlyContain(a => a.OperationName == "archlucid.agent.handle");

        string[] types = completedSnapshot
            .Select(a => (string)a.GetTagItem("archlucid.agent.type")!)
            .OrderBy(s => s, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        types.Should().Equal(AgentTypeKeys.Compliance, AgentTypeKeys.Topology);
    }

    [SkippableFact]
    public async Task ExecuteAsync_runs_multiple_handlers_concurrently_so_topology_can_unblock_compliance()
    {
        // Dispatch-key order is Compliance then Topology. Compliance blocks until Topology runs; sequential execution would deadlock.
        using SemaphoreSlim complianceMayContinue = new(0, 1);

        IAgentHandler compliance = new DeadlockAwareComplianceHandler(complianceMayContinue);
        IAgentHandler topology = new SignalingTopologyHandler(complianceMayContinue);

        RealAgentExecutor sut = CreateSut(topology, compliance);
        ArchitectureRequest request = new()
        {
            RequestId = "r1", Description = "1234567890ab", SystemName = "S", Environment = "prod"
        };
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask taskTopology = new() { TaskId = "tz", RunId = runId, AgentType = AgentType.Topology };
        AgentTask taskCompliance = new() { TaskId = "tc", RunId = runId, AgentType = AgentType.Compliance };

        using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(5));

        Func<Task> act = async () =>
            await sut.ExecuteAsync(runId, request, evidence, [taskTopology, taskCompliance], timeout.Token);

        await act.Should().NotThrowAsync();
    }

    [SkippableFact]
    public async Task ExecuteAsync_when_one_parallel_handler_fails_fails_closed_surfaces_AgentHandlerExecutionException_with_rate_limit_inner()
    {
        using SemaphoreSlim topologyCompleted = new(0, 1);
        HttpRequestException rateLimit = new("unit-test-quota", null, HttpStatusCode.TooManyRequests);
        IAgentHandler compliance = new ThrowingAgentHandler(AgentType.Compliance, rateLimit);
        IAgentHandler topology = new SignalingCompletionHandler(AgentType.Topology, topologyCompleted);

        RealAgentExecutor sut = CreateSut(topology, compliance);
        ArchitectureRequest request = new()
        {
            RequestId = "r1", Description = "1234567890ab", SystemName = "S", Environment = "prod"
        };
        AgentEvidencePackage evidence = new();
        string runId = Guid.NewGuid().ToString("N");
        AgentTask taskTopology = new() { TaskId = "tz", RunId = runId, AgentType = AgentType.Topology };
        AgentTask taskCompliance = new() { TaskId = "tc", RunId = runId, AgentType = AgentType.Compliance };

        Func<Task> act = async () =>
            await sut.ExecuteAsync(runId, request, evidence, [taskTopology, taskCompliance], CancellationToken.None);

        ExceptionAssertions<AgentExecutionFailedException> thrown =
            await act.Should().ThrowAsync<AgentExecutionFailedException>();

        thrown.Which.RunId.Should().Be(runId);
        thrown.Which.TaskCorrelation.Should().Be("tc");
        thrown.Which.InnerException.Should().BeOfType<AgentHandlerExecutionException>();

        AgentHandlerExecutionException handlerEx = (AgentHandlerExecutionException)thrown.Which.InnerException!;

        handlerEx.AgentTypeKey.Should().Be(AgentTypeKeys.Compliance);
        handlerEx.AgentType.Should().Be(AgentType.Compliance);
        handlerEx.InnerException.Should().BeOfType<HttpRequestException>();
        HttpRequestException httpEx = (HttpRequestException)handlerEx.InnerException!;
        httpEx.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);

        bool topologySignaled = await topologyCompleted.WaitAsync(TimeSpan.FromSeconds(5));

        topologySignaled.Should().BeTrue("parallel handlers can finish the successful path before WhenAll faults");
    }

    [SkippableFact]
    public async Task ExecuteAsync_when_handler_throws_wraps_as_AgentHandlerExecutionException_with_fixed_outer_message()
    {
        InvalidOperationException innerCause = new("sensitive llm/provider body");
        ThrowingAgentHandler failing = new(AgentType.Topology, innerCause);
        RealAgentExecutor sut = CreateSut(failing);
        ArchitectureRequest request = new() { RequestId = "r1", Description = "1234567890ab", SystemName = "S" };
        AgentTask task = new() { TaskId = "t", RunId = "run1", AgentType = AgentType.Topology };

        Func<Task> act = async () =>
            await sut.ExecuteAsync("run1", request, new AgentEvidencePackage(), [task], CancellationToken.None);

        ExceptionAssertions<AgentExecutionFailedException> thrown =
            await act.Should().ThrowAsync<AgentExecutionFailedException>();

        thrown.Which.RunId.Should().Be("run1");
        thrown.Which.TaskCorrelation.Should().Be("t");
        thrown.Which.InnerException.Should().BeOfType<AgentHandlerExecutionException>();

        AgentHandlerExecutionException handlerEx = (AgentHandlerExecutionException)thrown.Which.InnerException!;

        handlerEx.Message.Should().Be("Agent handler execution failed.");
        handlerEx.AgentTypeKey.Should().Be(AgentTypeKeys.Topology);
        handlerEx.AgentType.Should().Be(AgentType.Topology);
        handlerEx.InnerException.Should().BeSameAs(innerCause);
    }

    private sealed class ThrowingAgentHandler(AgentType agentType, Exception toThrow) : IAgentHandler
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
            _ = runId;
            _ = request;
            _ = evidence;
            _ = task;
            _ = cancellationToken;

            throw toThrow;
        }
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

    private sealed class FixedScopeProvider(ScopeContext scope) : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope()
        {
            return scope;
        }
    }

    private sealed class ProviderReasoningStubHandler(
        AgentType agentType,
        string providerSnippet,
        string? handlerReasoningTrace) : IAgentHandler
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
            _ = request;
            _ = evidence;
            _ = cancellationToken;

            AgentHandlerLlmReasoningTrace.AppendCompletionSnippet(providerSnippet);

            return Task.FromResult(
                new AgentResult
                {
                    RunId = runId,
                    TaskId = task.TaskId,
                    AgentType = agentType,
                    Claims = [],
                    EvidenceRefs = [],
                    ReasoningTrace = handlerReasoningTrace
                });
        }
    }

    private sealed class StubAgentHandler(AgentType agentType) : IAgentHandler
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
            _ = runId;
            _ = request;
            _ = evidence;
            _ = task;
            _ = cancellationToken;

            return Task.FromResult(new AgentResult());
        }
    }

    private sealed class OrderingStubHandler(AgentType agentType, List<AgentType> observed) : IAgentHandler
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
            observed.Add(agentType);

            return Task.FromResult(
                new AgentResult
                {
                    RunId = runId,
                    TaskId = task.TaskId,
                    AgentType = agentType,
                    Claims = [],
                    EvidenceRefs = []
                });
        }
    }

    private sealed class DeadlockAwareComplianceHandler(SemaphoreSlim complianceMayContinue) : IAgentHandler
    {
        public AgentType AgentType => AgentType.Compliance;

        public string AgentTypeKey => AgentTypeKeys.Compliance;

        public async Task<AgentResult> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            AgentTask task,
            CancellationToken cancellationToken = default)
        {
            await complianceMayContinue.WaitAsync(cancellationToken);

            return new AgentResult
            {
                RunId = runId,
                TaskId = task.TaskId,
                AgentType = AgentType.Compliance,
                Claims = [],
                EvidenceRefs = []
            };
        }
    }

    private sealed class SignalingCompletionHandler(AgentType agentType, SemaphoreSlim completed) : IAgentHandler
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
            _ = request;
            _ = evidence;

            completed.Release();

            return Task.FromResult(
                new AgentResult
                {
                    RunId = runId,
                    TaskId = task.TaskId,
                    AgentType = agentType,
                    Claims = [],
                    EvidenceRefs = []
                });
        }
    }

    private sealed class SignalingTopologyHandler(SemaphoreSlim complianceMayContinue) : IAgentHandler
    {
        public AgentType AgentType => AgentType.Topology;

        public string AgentTypeKey => AgentTypeKeys.Topology;

        public Task<AgentResult> ExecuteAsync(
            string runId,
            ArchitectureRequest request,
            AgentEvidencePackage evidence,
            AgentTask task,
            CancellationToken cancellationToken = default)
        {
            complianceMayContinue.Release();

            return Task.FromResult(
                new AgentResult
                {
                    RunId = runId,
                    TaskId = task.TaskId,
                    AgentType = AgentType.Topology,
                    Claims = [],
                    EvidenceRefs = []
                });
        }
    }
}
