using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Structured <see cref="ILogger" /> helpers for Debug-level messages with user-derived string placeholders (CWE-117).
/// </summary>
/// <remarks>
///     Each public wrapper sanitizes user-derived <see cref="string" /> arguments through
///     <see cref="LogSanitizer.Sanitize(string?)" /> and forwards them to a private
///     <see cref="LoggerMessageAttribute" />-generated emitter declared in
///     <c>SanitizedLoggerDebugExtensions.LoggerMessage.cs</c>. This preserves the CodeQL
///     <c>cs/log-forging</c> barrier through to the <see cref="ILogger.Log{TState}" /> sink without
///     <c>params object?[]</c> boxing (see <c>docs/library/CODEQL_TRIAGE.md</c>).
/// </remarks>
public static partial class SanitizedLoggerDebugExtensions
{
    /// <summary>Logs per-task agent handler completion with three user-derived strings sanitized.</summary>
    public static void LogDebugAgentTaskFinished(
        this ILogger logger,
        string userRunId,
        string userTaskId,
        string userAgentTypeKey,
        long durationMs)
    {
        ArgumentNullException.ThrowIfNull(logger);

        string safeRunId = LogSanitizer.Sanitize(userRunId);
        string safeTaskId = LogSanitizer.Sanitize(userTaskId);
        string safeAgentTypeKey = LogSanitizer.Sanitize(userAgentTypeKey);

        EmitAgentTaskFinished(logger, safeRunId, safeTaskId, safeAgentTypeKey, durationMs);
    }

    /// <summary>Logs a curated evidence proposal skip with two user-derived strings sanitized.</summary>
    public static void LogDebugCuratedEvidenceProposalSkipped(
        this ILogger logger,
        Exception exception,
        string userRunId,
        string userAgentType)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(exception);

        string safeRunId = LogSanitizer.Sanitize(userRunId);
        string safeAgentType = LogSanitizer.Sanitize(userAgentType);

        EmitCuratedEvidenceProposalSkipped(logger, exception, safeRunId, safeAgentType);
    }

    /// <summary>Logs a reference-case evaluation failure with four user-derived strings sanitized.</summary>
    public static void LogDebugReferenceCaseEvaluationFailed(
        this ILogger logger,
        string userCaseId,
        string userRunId,
        string userTraceId,
        string userFailureReason)
    {
        ArgumentNullException.ThrowIfNull(logger);

        string safeCaseId = LogSanitizer.Sanitize(userCaseId);
        string safeRunId = LogSanitizer.Sanitize(userRunId);
        string safeTraceId = LogSanitizer.Sanitize(userTraceId);
        string safeReason = LogSanitizer.Sanitize(userFailureReason);

        EmitReferenceCaseEvaluationFailed(logger, safeCaseId, safeRunId, safeTraceId, safeReason);
    }

    /// <summary>Logs an AWS Price List EC2 probe failure with region and instance type sanitized.</summary>
    public static void LogDebugAwsPricingProbeFailed(
        this ILogger logger,
        Exception exception,
        string regionCode,
        string instanceType)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(exception);

        string safeRegionCode = LogSanitizer.Sanitize(regionCode);
        string safeInstanceType = LogSanitizer.Sanitize(instanceType);

        EmitAwsPricingProbeFailed(logger, exception, safeRegionCode, safeInstanceType);
    }
}
