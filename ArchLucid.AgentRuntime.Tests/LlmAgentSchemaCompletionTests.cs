using System.Net;

using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Resilience;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using Polly;

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

    [Fact]
    public async Task CompleteAsync_two_failures_then_success_persists_three_attempt_traces()
    {
        Mock<IAgentCompletionClient> completion = new();
        ListCapturingAgentExecutionTraceRecorder traceRecorder = new();

        completion
            .SetupSequence(c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("{ not valid json")
            .ReturnsAsync("{ still bad")
            .ReturnsAsync(ValidTopologyJson);

        AgentResultParser parser = new();

        IOptionsMonitor<AgentSchemaRemediationOptions> remediation =
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(maxCompletionAttempts: 3);

        (string _, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
            completion.Object,
            parser,
            remediation,
            AgentType.Topology,
            "run1",
            "task1",
            "sys",
            "user base",
            traceRecorder: traceRecorder,
            cancellationToken: CancellationToken.None);

        parsed.ResultId.Should().Be("res1");
        traceRecorder.Calls.Should().HaveCount(3);
        traceRecorder.Calls[0].ParseSucceeded.Should().BeFalse();
        traceRecorder.Calls[0].AttemptIndex.Should().Be(0);
        traceRecorder.Calls[0].FailureReasonCode.Should().Be(AgentExecutionTraceFailureReasonCodes.SchemaRemediationParseFailed);
        traceRecorder.Calls[1].ParseSucceeded.Should().BeFalse();
        traceRecorder.Calls[1].AttemptIndex.Should().Be(1);
        traceRecorder.Calls[2].ParseSucceeded.Should().BeTrue();
        traceRecorder.Calls[2].AttemptIndex.Should().Be(2);
        traceRecorder.Calls[2].FailureReasonCode.Should().BeNull();
    }

    [Fact]
    public async Task CompleteAsync_applies_polly_retries_only_on_first_schema_attempt()
    {
        int primaryInnerCalls = 0;
        int remediationInnerCalls = 0;

        Mock<IAgentCompletionClient> primaryInner = new();
        primaryInner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("primary", "primary"));
        primaryInner
            .Setup(c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                int call = Interlocked.Increment(ref primaryInnerCalls);

                if (call <= 2)
                {
                    return Task.FromException<string>(
                        new HttpRequestException("rate limited", null, HttpStatusCode.TooManyRequests));
                }

                return Task.FromResult("{ not valid json");
            });

        Mock<IAgentCompletionClient> remediationInner = new();
        remediationInner.SetupGet(c => c.Descriptor).Returns(LlmProviderDescriptor.ForOffline("remediation", "remediation"));
        remediationInner
            .Setup(c => c.CompleteJsonAsync("sys", It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                Interlocked.Increment(ref remediationInnerCalls);

                return Task.FromResult(ValidTopologyJson);
            });

        using CircuitBreakingAgentCompletionClient primaryWithRetry =
            CreatePrimaryWithPollyRetry(primaryInner.Object, maxRetryAttempts: 2);

        AgentResultParser parser = new();

        IOptionsMonitor<AgentSchemaRemediationOptions> remediationOptions =
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(maxCompletionAttempts: 3);

        (string _, AgentResult parsed) = await LlmAgentSchemaCompletion.CompleteAsync(
            primaryWithRetry,
            parser,
            remediationOptions,
            AgentType.Topology,
            "run1",
            "task1",
            "sys",
            "user base",
            remediationCompletionClient: remediationInner.Object,
            cancellationToken: CancellationToken.None);

        parsed.ResultId.Should().Be("res1");
        primaryInnerCalls.Should().Be(3);
        remediationInnerCalls.Should().Be(1);
    }

    private static CircuitBreakingAgentCompletionClient CreatePrimaryWithPollyRetry(
        IAgentCompletionClient inner,
        int maxRetryAttempts)
    {
        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 10,
            DurationOfBreakSeconds = 60
        };
        CircuitBreakerGate gate = new("schema-primary-gate", options);
        ResiliencePipeline retry = LlmCallResilienceDefaults.BuildLlmRetryPipeline(
            logger: NullLogger.Instance,
            maxRetryAttempts: maxRetryAttempts,
            baseDelay: TimeSpan.FromMilliseconds(1),
            maxDelay: TimeSpan.FromMilliseconds(50));

        return new CircuitBreakingAgentCompletionClient(
            inner,
            gate,
            retry,
            NullLogger<CircuitBreakingAgentCompletionClient>.Instance);
    }
}
