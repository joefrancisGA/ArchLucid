using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Structured <see cref="ILogger" /> helpers for Error-level messages that include request-derived strings (CWE-117).
/// </summary>
/// <remarks>
///     CodeQL <c>cs/log-forging</c> may not propagate <see cref="LogSanitizer.Sanitize" /> through
///     <see cref="LoggerExtensions.LogError(ILogger, Exception?, string?, object?[])" /> <c>params</c> boxing at call
///     sites.
///     Sanitizing in this helper keeps barrier and sink adjacent (see <c>docs/CODEQL_TRIAGE.md</c>).
/// </remarks>
public static class SanitizedLoggerErrorExtensions
{
    /// <summary>
    ///     Logs an unhandled exception with HTTP method and path after sanitization (worker / minimal HTTP hosts).
    /// </summary>
    public static void LogErrorUnhandledWorkerHttpRequest(
        this ILogger logger,
        Exception ex,
        string? requestMethod,
        string? requestPath)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(ex);

        string safeMethod = LogSanitizer.Sanitize(requestMethod);
        string safePath = LogSanitizer.Sanitize(requestPath);

        logger.LogError(
            ex,
            "Unhandled exception for {Method} {Path}",
            safeMethod,
            safePath); // codeql[cs/log-forging]: method and path sanitized immediately above.
    }

    /// <summary>
    ///     Logs a mapped <c>application/problem+json</c> response (5xx) with the original exception so operators
    ///     can see database/SQL details that are intentionally omitted from the client-facing Problem Details body.
    /// </summary>
    public static void LogErrorMappedProblemDetailsException(
        this ILogger logger,
        Exception ex,
        string? requestMethod,
        string? requestPath,
        int statusCode,
        string? problemType,
        int? sqlErrorNumber,
        string? correlationId)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(ex);

        string safeMethod = LogSanitizer.Sanitize(requestMethod);
        string safePath = LogSanitizer.Sanitize(requestPath);
        string safeProblemType = LogSanitizer.Sanitize(problemType);
        string safeCorrelationId = LogSanitizer.Sanitize(correlationId);

        logger.LogError(
            ex,
            "Mapped exception to HTTP {StatusCode} ({ProblemType}) for {Method} {Path}. SqlErrorNumber={SqlErrorNumber}. CorrelationId={CorrelationId}",
            statusCode,
            safeProblemType,
            safeMethod,
            safePath,
            sqlErrorNumber,
            safeCorrelationId); // codeql[cs/log-forging]: method, path, problem type, and correlation id sanitized immediately above.
    }

    /// <summary>
    ///     Logs a failed run-scoped LLM budget reservation with sanitized tenant/run identifiers (CWE-117).
    /// </summary>
    public static void LogErrorRunScopedLlmBudgetReservationFailed(
        this ILogger logger,
        Exception ex,
        Guid tenantId,
        string? userRunId)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(ex);

        string safeRunId = LogSanitizer.Sanitize(userRunId);

        logger.LogError(
            ex,
            "Run-scoped LLM budget reservation failed for tenant {TenantId} run {RunId}.",
            tenantId,
            safeRunId); // codeql[cs/log-forging]: run id sanitized immediately above.
    }
}
