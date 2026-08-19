using System.Diagnostics;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Diagnostics;

using Polly.CircuitBreaker;
using Polly.Timeout;

namespace ArchLucid.AgentRuntime;

/// <summary>Records operator-visible telemetry when a non-Critic handler returns a degraded placeholder result.</summary>
public static class AgentHandlerDegradationTelemetry
{
    /// <summary>Maps a resilience exception chain to a bounded degradation reason code.</summary>
    public static string ResolveReasonCode(Exception exception)
    {
        ArgumentNullException.ThrowIfNull(exception);

        for (Exception? walker = exception; walker is not null; walker = walker.InnerException)
        {
            if (walker is TimeoutRejectedException)
                return AgentHandlerDegradationReasonCodes.HandlerTimeout;

            if (walker is BrokenCircuitException)
                return AgentHandlerDegradationReasonCodes.CircuitOpen;
        }

        return AgentHandlerDegradationReasonCodes.ResilienceFailure;
    }

    /// <summary>Emits counter, span tags, and a durable activity event (no prompt content).</summary>
    public static void Record(
        Activity? activity,
        string runId,
        AgentTask task,
        string handlerKey,
        string degradationReasonCode)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(task);
        ArgumentException.ThrowIfNullOrWhiteSpace(handlerKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(degradationReasonCode);

        string agentTypeKey = handlerKey.Trim();
        string reason = degradationReasonCode.Trim();

        ArchLucidInstrumentation.RecordAgentHandlerDegraded(agentTypeKey, reason);

        activity?.SetTag("archlucid.agent.degraded", true);
        activity?.SetTag("archlucid.agent.degradation_reason", reason);
        activity?.SetTag("archlucid.agent.handler_key", agentTypeKey);

        ActivityTagsCollection eventTags = new()
        {
            { "archlucid.run_id", runId },
            { "archlucid.task_id", task.TaskId },
            { "archlucid.agent.type", agentTypeKey },
            { "archlucid.agent.type_enum", task.AgentType.ToString() },
            { "archlucid.agent.degradation_reason", reason },
        };

        activity?.AddEvent(new ActivityEvent("agent.handler.degraded", tags: eventTags));
    }
}
