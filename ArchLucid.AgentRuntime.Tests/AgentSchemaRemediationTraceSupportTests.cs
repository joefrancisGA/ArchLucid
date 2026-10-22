using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentSchemaRemediationTraceSupportTests
{
    [Fact]
    public void ShouldSkipHandlerFailureTrace_for_schema_and_validation_failures()
    {
        AgentSchemaRemediationTraceSupport
            .ShouldSkipHandlerFailureTrace(new AgentResultSchemaViolationException(
                "schema failed",
                ["bad field"],
                "{}",
                AgentType.Topology))
            .Should()
            .BeTrue();

        AgentSchemaRemediationTraceSupport
            .ShouldSkipHandlerFailureTrace(new AgentResultValidationException("run mismatch"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void ShouldSkipHandlerFailureTrace_for_retryable_parse_failures()
    {
        InvalidOperationException ex = new("Failed to deserialize AgentResult from JSON.");

        AgentSchemaRemediationTraceSupport.ShouldSkipHandlerFailureTrace(ex).Should().BeTrue();
    }

    [Fact]
    public void ShouldSkipHandlerFailureTrace_false_for_unrelated_exceptions()
    {
        AgentSchemaRemediationTraceSupport
            .ShouldSkipHandlerFailureTrace(new InvalidOperationException("network timeout"))
            .Should()
            .BeFalse();
    }

    [Fact]
    public async Task RecordAttemptAsync_forwards_ambient_token_counts_to_trace_recorder()
    {
        AzureOpenAiCompletionClient.SeedLastCompletionTokenUsageForTests(11, 22);
        CapturingTraceRecorder recorder = new();

        await AgentSchemaRemediationTraceSupport.RecordAttemptAsync(
            recorder,
            attemptIndex: 0,
            runId: "run-1",
            taskId: "task-1",
            agentType: AgentType.Topology,
            systemPrompt: "sys",
            userPrompt: "user",
            rawResponse: "{}",
            parseSucceeded: true,
            errorMessage: null,
            promptRepro: null);

        recorder.LastInputTokenCount.Should().Be(11);
        recorder.LastOutputTokenCount.Should().Be(22);
    }

    private sealed class CapturingTraceRecorder : IAgentExecutionTraceRecorder
    {
        public int? LastInputTokenCount
        {
            get;
            private set;
        }

        public int? LastOutputTokenCount
        {
            get;
            private set;
        }

        public Task RecordAsync(
            string runId,
            string taskId,
            AgentType agentType,
            string systemPrompt,
            string userPrompt,
            string rawResponse,
            string? parsedResultJson,
            bool parseSucceeded,
            string? errorMessage,
            AgentPromptReproMetadata? promptRepro = null,
            int? inputTokenCount = null,
            int? outputTokenCount = null,
            int? reasoningTokenCount = null,
            string? modelDeploymentName = null,
            string? modelVersion = null,
            bool isSimulatorExecution = false,
            string? failureReasonCode = null,
            float? completionTemperature = null,
            int? maxCompletionTokens = null,
            float? completionTopP = null,
            int attemptIndex = 0,
            CancellationToken cancellationToken = default)
        {
            LastInputTokenCount = inputTokenCount;
            LastOutputTokenCount = outputTokenCount;

            return Task.CompletedTask;
        }
    }
}
