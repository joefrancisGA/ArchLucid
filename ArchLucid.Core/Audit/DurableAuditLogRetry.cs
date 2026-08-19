using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Audit;

/// <summary>
///     Bounded retries for durable SQL audit writes on security-relevant paths where a single transient failure
///     should not silently drop the audit row.
/// </summary>
public static class DurableAuditLogRetry
{
    /// <summary>
    ///     Runs <paramref name="writeAsync" /> up to <paramref name="maxAttempts" /> times with short backoff.
    ///     Logs and suppresses the final exception so callers keep their non-audit behavior.
    /// </summary>
    public static Task TryLogAsync(
        Func<CancellationToken, Task> writeAsync,
        ILogger logger,
        string operationLabel,
        CancellationToken cancellationToken,
        int maxAttempts = 3,
        string? auditEventTypeForMetrics = null)
    {
        return ExecuteWithRetryAsync(
            writeAsync,
            logger,
            operationLabel,
            cancellationToken,
            maxAttempts,
            auditEventTypeForMetrics,
            throwOnAbandon: false);
    }

    /// <summary>
    ///     Runs <paramref name="writeAsync" /> up to <paramref name="maxAttempts" /> times with short backoff.
    ///     Throws <see cref="DurableAuditWriteFailedException" /> when all attempts fail so the caller operation fails closed.
    /// </summary>
    public static Task LogOrThrowAsync(
        Func<CancellationToken, Task> writeAsync,
        ILogger logger,
        string operationLabel,
        CancellationToken cancellationToken,
        int maxAttempts = 3,
        string? auditEventTypeForMetrics = null)
    {
        return ExecuteWithRetryAsync(
            writeAsync,
            logger,
            operationLabel,
            cancellationToken,
            maxAttempts,
            auditEventTypeForMetrics,
            throwOnAbandon: true);
    }

    private static async Task ExecuteWithRetryAsync(
        Func<CancellationToken, Task> writeAsync,
        ILogger logger,
        string operationLabel,
        CancellationToken cancellationToken,
        int maxAttempts,
        string? auditEventTypeForMetrics,
        bool throwOnAbandon)
    {
        ArgumentNullException.ThrowIfNull(writeAsync);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentException.ThrowIfNullOrWhiteSpace(operationLabel);

        if (maxAttempts < 1)
            throw new ArgumentOutOfRangeException(nameof(maxAttempts));

        Exception? last = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++)

            try
            {
                await writeAsync(cancellationToken);

                return;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                last = ex;

                if (logger.IsEnabled(LogLevel.Warning))
                {
                    string safeOperationLabel = LogSanitizer.Sanitize(operationLabel);

                    logger.LogWarning(
                        ex,
                        "Durable audit attempt {Attempt}/{MaxAttempts} failed for {OperationLabel}",
                        attempt,
                        maxAttempts,
                        safeOperationLabel); // codeql[cs/log-forging]: OperationLabel sanitized immediately above.
                }

                if (attempt < maxAttempts)

                    await Task.Delay(TimeSpan.FromMilliseconds(50 * (1 << (attempt - 1))), cancellationToken);
            }

        if (last is null)
            return;

        if (logger.IsEnabled(LogLevel.Warning))
        {
            string safeOperationLabel = LogSanitizer.Sanitize(operationLabel);

            logger.LogWarning(
                last,
                "Durable audit abandoned after {MaxAttempts} attempts for {OperationLabel}",
                maxAttempts,
                safeOperationLabel); // codeql[cs/log-forging]: OperationLabel sanitized immediately above.
        }

        if (!string.IsNullOrWhiteSpace(auditEventTypeForMetrics))
            ArchLucidInstrumentation.RecordAuditWriteFailure(auditEventTypeForMetrics);

        // LogOrThrow is the Required / fail-closed path (INV-003 / TB-953). Pageable abandon signal is
        // separate from informational TryLogAsync soft-fail metrics (TB-001 / TB-955).
        if (throwOnAbandon)
        {
            ArchLucidInstrumentation.RecordRequiredAuditWriteAbandon(auditEventTypeForMetrics);
            throw new DurableAuditWriteFailedException(operationLabel, last);
        }
    }
}
