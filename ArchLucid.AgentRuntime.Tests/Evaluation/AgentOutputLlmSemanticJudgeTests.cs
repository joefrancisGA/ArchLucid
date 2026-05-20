using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;
[Trait("Category", "Unit")]

public sealed class AgentOutputLlmSemanticJudgeTests
{
    [Theory]
    [InlineData(AgentType.Topology, true)]
    [InlineData(AgentType.Critic, true)]
    [InlineData(AgentType.Cost, false)]
    [InlineData(AgentType.Compliance, false)]
    public void IsLlmJudgeEligibleAgentType_matches_product_rule(AgentType agentType, bool expected) =>
        AgentOutputLlmSemanticJudge.IsLlmJudgeEligibleAgentType(agentType).Should().Be(expected);

    [Fact]
    public async Task TryJudgeAsync_returns_null_when_disabled_without_calling_completion()
    {
        Mock<IAgentCompletionClient> client = new();
        AgentOutputLlmSemanticJudge judge = CreateJudge(client.Object, enabled: false, mode: "Real");

        AgentOutputLlmJudgeParsedResult? result =
            await judge.TryJudgeAsync("trace-1", "{}", AgentType.Topology, CancellationToken.None);

        result.Should().BeNull();
        client.Verify(
            c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryJudgeAsync_skips_cost_agent_without_calling_completion()
    {
        Mock<IAgentCompletionClient> client = new();
        AgentOutputLlmSemanticJudge judge = CreateJudge(client.Object, enabled: true, mode: "Real");

        AgentOutputLlmJudgeParsedResult? result =
            await judge.TryJudgeAsync("trace-1", "{}", AgentType.Cost, CancellationToken.None);

        result.Should().BeNull();
        client.Verify(
            c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryJudgeAsync_topology_parses_completion_json()
    {
        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("""{"overallQuality":0.82,"rationale":"solid evidence links"}""");

        AgentOutputLlmSemanticJudge judge = CreateJudge(client.Object, enabled: true, mode: "Real");

        AgentOutputLlmJudgeParsedResult? result =
            await judge.TryJudgeAsync("trace-1", """{"claims":[]}""", AgentType.Topology, CancellationToken.None);

        result.Should().NotBeNull();
        result.OverallQuality.Should().BeApproximately(0.82, 1e-9);
        result.Rationale.Should().Contain("evidence");
        client.Verify(
            c => c.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static AgentOutputLlmSemanticJudge CreateJudge(
        IAgentCompletionClient completionClient,
        bool enabled,
        string mode)
    {
        ServiceCollection services = [];
        services.AddKeyedSingleton<IAgentCompletionClient>(
            AgentOutputLlmJudgeCompletionServiceKey.Value,
            (_, _) => completionClient);

        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions> judgeOpts = MockJudgeOptions(enabled);
        IOptionsMonitor<AgentExecutionOptions> execOpts = MockExecOptions(mode);

        return new AgentOutputLlmSemanticJudge(
            scopeFactory,
            judgeOpts,
            execOpts,
            NullLogger<AgentOutputLlmSemanticJudge>.Instance);
    }

    private static IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions> MockJudgeOptions(bool enabled)
    {
        Mock<IOptionsMonitor<AgentOutputLlmSemanticJudgeOptions>> m = new();
        m.Setup(x => x.CurrentValue)
            .Returns(new AgentOutputLlmSemanticJudgeOptions
            {
                Enabled = enabled,
                SkipWhenSimulator = true,
            });

        return m.Object;
    }

    private static IOptionsMonitor<AgentExecutionOptions> MockExecOptions(string mode)
    {
        Mock<IOptionsMonitor<AgentExecutionOptions>> m = new();
        m.Setup(x => x.CurrentValue).Returns(new AgentExecutionOptions { Mode = mode });

        return m.Object;
    }
}
