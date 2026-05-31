using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using AgentExecutionTraceRecorderImpl = ArchLucid.AgentRuntime.AgentExecutionTraceRecorder;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     TB-033 — persisted LLM sampling params and reasoning token count on <see cref="AgentExecutionTrace" />.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecutionTraceRecorderSamplingParamsTests
{
    [SkippableFact]
    public async Task RecordAsync_persists_reasoning_tokens_and_sampling_params_from_ambient()
    {
        InMemoryAgentExecutionTraceRepository repo = new();
        AgentExecutionTraceRecorderImpl sut = CreateSut(repo);

        LlmCompletionRequestParamsAmbient.TestingSeed(temperature: 0.2f, maxOutputTokens: 4096, topP: 0.95f);

        string runId = Guid.NewGuid().ToString("N");

        await sut.RecordAsync(
            runId,
            "task-sampling",
            AgentType.Topology,
            "sys",
            "user",
            "{}",
            "{}",
            true,
            null,
            inputTokenCount: 100,
            outputTokenCount: 50,
            reasoningTokenCount: 25,
            isSimulatorExecution: true,
            cancellationToken: CancellationToken.None);

        IReadOnlyList<AgentExecutionTrace> stored = await repo.GetByTaskIdAsync("task-sampling", CancellationToken.None);

        stored.Should().ContainSingle();
        stored[0].ReasoningTokenCount.Should().Be(25);
        stored[0].CompletionTemperature.Should().Be(0.2f);
        stored[0].MaxCompletionTokens.Should().Be(4096);
        stored[0].CompletionTopP.Should().Be(0.95f);
    }

    private static AgentExecutionTraceRecorderImpl CreateSut(InMemoryAgentExecutionTraceRepository repo)
    {
        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(c => c.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
            .Returns(0m);

        Mock<IOptionsMonitor<LlmPromptRedactionOptions>> redactionMonitor = new();
        redactionMonitor.Setup(m => m.CurrentValue).Returns(new LlmPromptRedactionOptions { Enabled = false });

        IPromptRedactor redactor = new PromptRedactor(redactionMonitor.Object, NullLogger<PromptRedactor>.Instance);

        return new AgentExecutionTraceRecorderImpl(
            repo,
            cost.Object,
            Options.Create(new LlmCostEstimationOptions { Enabled = false }),
            Options.Create(new AgentExecutionTraceStorageOptions()),
            Mock.Of<IArtifactBlobStore>(),
            new NoOpAuditService(),
            new FixedScopeProvider(),
            redactionMonitor.Object,
            redactor,
            NullLogger<AgentExecutionTraceRecorderImpl>.Instance);
    }

    private sealed class FixedScopeProvider : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() =>
            new()
            {
                TenantId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                WorkspaceId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                ProjectId = Guid.Parse("00000000-0000-0000-0000-000000000003")
            };
    }

    private sealed class NoOpAuditService : IAuditService
    {
        public Task LogAsync(AuditEvent auditEvent, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
