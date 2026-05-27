using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmAgentSchemaCompletionTests
{
    private const string ValidTopologyJson =
        """
        {"runId":"run1","taskId":"task1","agentType":"Topology","resultId":"res1","claims":["c"],"evidenceRefs":["e"],"confidence":0.75,"createdUtc":"2026-01-01T00:00:00Z"}
        """;

    [Fact]
    public async Task CompleteAsync_when_first_completion_invalid_json_retries_and_returns_parsed_result()
    {
        Mock<IAgentCompletionClient> completion = new();

        completion
            .SetupSequence(c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("{ not valid json")
            .ReturnsAsync(ValidTopologyJson);

        AgentResultParser parser = new();

        IOptionsMonitor<AgentSchemaRemediationOptions> remediation =
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(maxCompletionAttempts: 3);

        (string rawJson, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
            completion.Object,
            parser,
            remediation,
            AgentType.Topology,
            "run1",
            "task1",
            "sys",
            "user base",
            cancellationToken: CancellationToken.None);

        rawJson.Should().Be(ValidTopologyJson);
        parsed.ResultId.Should().Be("res1");

        completion.Verify(
            c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));

        completion.Verify(
            c => c.CompleteJsonAsync(
                "sys",
                It.Is<string>(u => u.Contains("Remediation:", StringComparison.Ordinal)),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.AtLeastOnce());
    }

    [Fact]
    public async Task CompleteAsync_when_first_completion_fails_validation_retries_and_returns_parsed_result()
    {
        const string wrongRunJson =
            """
            {"runId":"wrong","taskId":"task1","agentType":"Topology","resultId":"res1","claims":["c"],"evidenceRefs":["e"],"confidence":0.75,"createdUtc":"2026-01-01T00:00:00Z"}
            """;

        Mock<IAgentCompletionClient> completion = new();

        completion
            .SetupSequence(c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(wrongRunJson)
            .ReturnsAsync(ValidTopologyJson);

        AgentResultParser parser = new();

        IOptionsMonitor<AgentSchemaRemediationOptions> remediation =
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(maxCompletionAttempts: 3);

        (string rawJson, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
            completion.Object,
            parser,
            remediation,
            AgentType.Topology,
            "run1",
            "task1",
            "sys",
            "user base",
            cancellationToken: CancellationToken.None);

        rawJson.Should().Be(ValidTopologyJson);
        parsed.RunId.Should().Be("run1");

        completion.Verify(
            c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task CompleteAsync_when_json_invalid_and_max_attempts_one_propagates()
    {
        Mock<IAgentCompletionClient> completion = new();

        completion
            .Setup(c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("{");

        AgentResultParser parser = new();

        IOptionsMonitor<AgentSchemaRemediationOptions> remediation =
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(maxCompletionAttempts: 1);

        Func<Task> act = async () => _ = await LlmAgentSchemaCompletion.CompleteAsync(
            completion.Object,
            parser,
            remediation,
            AgentType.Topology,
            "run1",
            "task1",
            "sys",
            "user",
            cancellationToken: CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*deserialize*");

        completion.Verify(
            c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CompleteAsync_uses_dedicated_remediation_client_for_retry_attempts()
    {
        Mock<IAgentCompletionClient> primary = new();
        Mock<IAgentCompletionClient> remediation = new();

        primary
            .Setup(c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("{ not valid json");

        remediation
            .Setup(c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(ValidTopologyJson);

        AgentResultParser parser = new();

        IOptionsMonitor<AgentSchemaRemediationOptions> remediationOptions =
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(maxCompletionAttempts: 3);

        (string _, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
            primary.Object,
            parser,
            remediationOptions,
            AgentType.Topology,
            "run1",
            "task1",
            "sys",
            "user base",
            remediationCompletionClient: remediation.Object,
            cancellationToken: CancellationToken.None);

        parsed.ResultId.Should().Be("res1");

        primary.Verify(
            c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()),
            Times.Once);

        remediation.Verify(
            c => c.CompleteJsonAsync(
                "sys",
                It.Is<string>(u => u.Contains("Remediation:", StringComparison.Ordinal)),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.AtLeastOnce());
    }
}
