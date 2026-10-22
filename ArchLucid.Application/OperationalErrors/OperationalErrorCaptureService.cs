using System.Collections.Concurrent;

using System.Text.Json;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.OperationalErrors;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.OperationalErrors;

/// <summary>Builds and enqueues operational error rows without blocking callers.</summary>
public sealed class OperationalErrorCaptureService(
    IOperationalErrorCaptureQueue queue,
    IOptionsMonitor<OperationalErrorOptions> options,
    ILogger<OperationalErrorCaptureService> logger) : IOperationalErrorCaptureService
{
    private readonly IOperationalErrorCaptureQueue _queue =
        queue ?? throw new ArgumentNullException(nameof(queue));

    private readonly IOptionsMonitor<OperationalErrorOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<OperationalErrorCaptureService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly ConcurrentDictionary<string, FingerprintWindow> _fingerprintWindows = new();

    public void TryCapture(OperationalErrorCaptureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        OperationalErrorOptions opts = _options.CurrentValue;

        if (!opts.Enabled)
            return;

        if (request.HttpStatusCode is int status && status < opts.MinHttpStatusCode)
            return;

        if (OperationalErrorPathExclusion.IsExcluded(request.RequestPath, opts.ExcludePathPrefixes))
            return;

        if (IsRateLimited(request, opts))
            return;

        try
        {
            OperationalErrorRecord record = OperationalErrorRecordBuilder.Build(request, opts);

            if (!_queue.TryEnqueue(record) && _logger.IsEnabled(LogLevel.Debug))
                _logger.LogDebug("Operational error capture queue full; dropped row {OperationalErrorId}.", record.Id);
        }
        catch (Exception ex) when (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(ex, "Operational error capture failed before enqueue.");
        }
    }

    private bool IsRateLimited(OperationalErrorCaptureRequest request, OperationalErrorOptions opts)
    {
        if (opts.MaxCapturesPerFingerprintPerMinute <= 0)
            return false;

        string fingerprint = BuildFingerprint(request);
        DateTime now = TimeProvider.System.UtcNowDateTime();
        DateTime windowStart = new(now.Year, now.Month, now.Day, now.Hour, now.Minute, 0, DateTimeKind.Utc);

        FingerprintWindow window = _fingerprintWindows.GetOrAdd(fingerprint, _ => new FingerprintWindow(windowStart, 0));

        lock (window)
        {
            if (window.WindowStartUtc != windowStart)
            {
                window.WindowStartUtc = windowStart;
                window.Count = 0;
            }

            if (window.Count >= opts.MaxCapturesPerFingerprintPerMinute)
                return true;

            window.Count++;
        }

        return false;
    }

    private static string BuildFingerprint(OperationalErrorCaptureRequest request)
    {
        string exceptionType = request.Exception?.GetType().FullName ?? string.Empty;

        return string.Join(
            '|',
            request.Category,
            request.Source,
            request.HttpStatusCode?.ToString() ?? string.Empty,
            request.RequestPath ?? string.Empty,
            exceptionType);
    }

    private sealed class FingerprintWindow(DateTime windowStartUtc, int count)
    {
        public DateTime WindowStartUtc
        {
            get;
            set;
        } = windowStartUtc;

        public int Count
        {
            get;
            set;
        } = count;
    }
}
