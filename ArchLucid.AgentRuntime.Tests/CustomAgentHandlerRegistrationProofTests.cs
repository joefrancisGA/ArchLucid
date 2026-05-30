using ArchLucid.AgentRuntime.Tests.Fixtures;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.AgentRuntime.Tests.Support;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>Registration and dispatch proof for custom in-repo handlers (assessment #18).</summary>
[Trait("Suite", "Core")]
public sealed class CustomAgentHandlerRegistrationProofTests
{
    [Fact]
    public void RealAgentExecutor_rejects_duplicate_handler_keys()
    {
        IAgentHandler[] handlers =
        [
            new SampleRiskReviewHandler(),
            new SampleRiskReviewHandler(),
        ];

        Action act = () => _ = CreateExecutor(handlers);

        act.Should().Throw<ArgumentException>()
            .WithMessage("*Duplicate IAgentHandler registrations*");
    }

    [Fact]
    public void Allowed_tools_guard_blocks_unlisted_custom_handler()
    {
        RealAgentExecutor executor = CreateExecutor(new SampleRiskReviewHandler());
        AgentTask task = new()
        {
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Critic,
            AgentTypeKey = "sample-risk-review",
            AllowedTools = ["Compliance"],
        };

        Func<Task> act = () => executor.ExecuteAsync(
            "run-1",
            MinimalRequest(),
            new AgentEvidencePackage(),
            [task],
            CancellationToken.None);

        act.Should().ThrowAsync<AgentToolNotAllowedException>();
    }

    [Fact]
    public async Task Custom_handler_executes_through_real_executor_dispatch_path()
    {
        RealAgentExecutor executor = CreateExecutor(new SampleRiskReviewHandler());
        AgentTask task = new()
        {
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Critic,
            AgentTypeKey = "sample-risk-review",
            AllowedTools = ["sample-risk-review"],
        };

        IReadOnlyList<AgentResult> results = await executor.ExecuteAsync(
            "run-1",
            MinimalRequest(),
            new AgentEvidencePackage(),
            [task],
            CancellationToken.None);

        results.Should().ContainSingle();
        results[0].Claims.Should().ContainSingle(static claim => claim.Contains("custom handler", StringComparison.OrdinalIgnoreCase));
    }

    private static ArchitectureRequest MinimalRequest() =>
        new()
        {
            RequestId = "req-1",
            SystemName = "Sample",
            Description = "0123456789",
            Environment = "prod",
        };

    private static RealAgentExecutor CreateExecutor(params IAgentHandler[] handlers)
    {
        IOptions<AgentExecutionResilienceOptions> resilience = Options.Create(
            new AgentExecutionResilienceOptions { MaxConcurrentHandlers = 0, PerHandlerTimeoutSeconds = 0 });

        return new RealAgentExecutor(
            handlers,
            NullLogger<RealAgentExecutor>.Instance,
            new StubPromptMonitor(new AgentPromptCatalogOptions()),
            new FixedScopeProvider(
                new ScopeContext
                {
                    TenantId = ScopeIds.DefaultTenant,
                    WorkspaceId = ScopeIds.DefaultWorkspace,
                    ProjectId = ScopeIds.DefaultProject,
                }),
            new AgentHandlerConcurrencyGate(resilience),
            resilience,
            Options.Create(new StagedCriticAgentOptions()),
            Options.Create(new AgentOutputQualityGateOptions()),
            new NoOpPromptRedactor(),
            new FixedValueOptionsMonitor<ArchLucidLlmOptions>(new ArchLucidLlmOptions()),
            new InMemoryAgentResultRepository());
    }
}
