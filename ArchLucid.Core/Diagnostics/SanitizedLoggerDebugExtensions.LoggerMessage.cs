using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Source-generated <see cref="ILogger" /> emitters for
///     <see cref="SanitizedLoggerDebugExtensions" />.
/// </summary>
/// <remarks>
///     EventIds use the 3100 series (Debug), sibling to the 3000 series (Information) reserved for
///     <c>ArchLucid.Core.Diagnostics</c> sanitized log emitters.
/// </remarks>
public static partial class SanitizedLoggerDebugExtensions
{
    [LoggerMessage(
        EventId = 3101,
        Level = LogLevel.Debug,
        Message =
            "Agent task finished: RunId={RunId}, TaskId={TaskId}, AgentTypeKey={AgentTypeKey}, DurationMs={DurationMs}")]
    private static partial void EmitAgentTaskFinished(
        ILogger logger,
        string runId,
        string taskId,
        string agentTypeKey,
        long durationMs);

    [LoggerMessage(
        EventId = 3102,
        Level = LogLevel.Debug,
        Message = "Curated evidence proposal skipped for RunId={RunId}, AgentType={AgentType}.")]
    private static partial void EmitCuratedEvidenceProposalSkipped(
        ILogger logger,
        Exception exception,
        string runId,
        string agentType);

    [LoggerMessage(
        EventId = 3103,
        Level = LogLevel.Debug,
        Message = "Reference case {CaseId} failed for run {RunId} trace {TraceId}: {Reason}")]
    private static partial void EmitReferenceCaseEvaluationFailed(
        ILogger logger,
        string caseId,
        string runId,
        string traceId,
        string reason);

    [LoggerMessage(
        EventId = 3104,
        Level = LogLevel.Debug,
        Message = "AWS Price List EC2 probe failed for {RegionCode}/{InstanceType}.")]
    private static partial void EmitAwsPricingProbeFailed(
        ILogger logger,
        Exception exception,
        string regionCode,
        string instanceType);
}
