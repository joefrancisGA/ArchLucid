using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;

using ArchLucid.AgentRuntime.Tests.Support;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Polly.Timeout;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentHandlerDegradedTraceRecorderTests
{
    [Fact]
    public async Task TryRecordAsync_persists_minimal_partial_trace()
    {
        CapturingAgentExecutionTraceRecorder traceRecorder = new();
        AgentTask task = new()
        {
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
        };

        await AgentHandlerDegradedTraceRecorder.TryRecordAsync(
            traceRecorder,
            NullLogger.Instance,
            "run-1",
            task,
            AgentTypeKeys.Topology,
            AgentHandlerDegradationReasonCodes.HandlerTimeout,
            "Agent output degraded due to upstream LLM latency or circuit-open state; review run telemetry.",
            new TimeoutRejectedException(),
            "topology-v1",
            CancellationToken.None);

        traceRecorder.CallCount.Should().Be(1);
        CapturingAgentExecutionTraceRecorder.CapturedTraceCall call = traceRecorder.LastCall!;
        call.RunId.Should().Be("run-1");
        call.TaskId.Should().Be("task-1");
        call.AgentType.Should().Be(AgentType.Topology);
        call.SystemPrompt.Should().BeEmpty();
        call.UserPrompt.Should().BeEmpty();
        call.RawResponse.Should().Contain("degraded");
        call.ParseSucceeded.Should().BeFalse();
        call.ParsedResultJson.Should().BeNull();
        call.FailureReasonCode.Should().Be(AgentHandlerDegradationReasonCodes.HandlerTimeout);
        call.ModelDeploymentName.Should().Be(AgentExecutionTraceModelMetadata.DegradedHandlerDeploymentName);
        call.ModelVersion.Should().Be(AgentExecutionTraceModelMetadata.DegradedHandlerModelVersion);
        call.InputTokenCount.Should().Be(0);
        call.OutputTokenCount.Should().Be(0);
        call.PromptRepro.Should().NotBeNull();
        call.PromptRepro!.TemplateId.Should().Be(AgentTypeKeys.Topology);
        call.PromptRepro.TemplateVersion.Should().Be("topology-v1");
    }

    [Fact]
    public async Task TryRecordAsync_swallows_recorder_failures()
    {
        ThrowingAgentExecutionTraceRecorder traceRecorder = new();
        AgentTask task = new()
        {
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
        };

        Func<Task> act = async () =>
            await AgentHandlerDegradedTraceRecorder.TryRecordAsync(
                traceRecorder,
                NullLogger.Instance,
                "run-1",
                task,
                AgentTypeKeys.Topology,
                AgentHandlerDegradationReasonCodes.CircuitOpen,
                "degraded",
                new InvalidOperationException("boom"),
                "default",
                CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    private sealed class ThrowingAgentExecutionTraceRecorder : IAgentExecutionTraceRecorder
    {
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
            throw new InvalidOperationException("trace insert failed");
        }
    }
}
