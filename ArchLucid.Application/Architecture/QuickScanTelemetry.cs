using ArchLucid.Contracts.Architecture;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Architecture;

public interface IQuickScanTelemetry
{
    void RecordAttempt(QuickScanGuardContext context);

    void RecordSuccess(
        QuickScanGuardContext context,
        string scanId,
        decimal estimatedCostUsd,
        int inputTokens,
        int outputTokens,
        string modelLabel,
        TimeSpan duration);

    void RecordRejection(QuickScanGuardContext context, QuickScanGuardRejectionReason reason);

    void RecordFailure(QuickScanGuardContext context, string failureCategory, TimeSpan duration);

    void RecordSampleView(QuickScanGuardContext context);
}

/// <inheritdoc cref="IQuickScanTelemetry" />
public sealed class QuickScanTelemetry(ILogger<QuickScanTelemetry> logger) : IQuickScanTelemetry
{
    public void RecordAttempt(QuickScanGuardContext context) =>
        Log("attempt", context, new Dictionary<string, object?>());

    public void RecordSuccess(
        QuickScanGuardContext context,
        string scanId,
        decimal estimatedCostUsd,
        int inputTokens,
        int outputTokens,
        string modelLabel,
        TimeSpan duration) =>
        Log(
            "success",
            context,
            new Dictionary<string, object?>
            {
                ["scanId"] = scanId,
                ["estimatedCostUsd"] = estimatedCostUsd,
                ["inputTokens"] = inputTokens,
                ["outputTokens"] = outputTokens,
                ["modelLabel"] = modelLabel,
                ["durationMs"] = (int)duration.TotalMilliseconds,
            });

    public void RecordRejection(QuickScanGuardContext context, QuickScanGuardRejectionReason reason) =>
        Log("rejected", context, new Dictionary<string, object?> { ["reason"] = reason.ToString() });

    public void RecordFailure(QuickScanGuardContext context, string failureCategory, TimeSpan duration) =>
        Log(
            "failure",
            context,
            new Dictionary<string, object?>
            {
                ["failureCategory"] = failureCategory,
                ["durationMs"] = (int)duration.TotalMilliseconds,
            });

    public void RecordSampleView(QuickScanGuardContext context) =>
        Log("sample_view", context, new Dictionary<string, object?>());

    private void RecordInternal(string eventName, QuickScanGuardContext context, IReadOnlyDictionary<string, object?> data)
    {
        using IDisposable? scope = logger.BeginScope(
            new Dictionary<string, object>
            {
                ["quickScanEvent"] = eventName,
                ["clientIpHash"] = HashForLog(context.ClientIp),
                ["sessionIdHash"] = HashForLog(context.SessionId),
            });

        logger.LogInformation(
            "Quick Scan telemetry {EventName} {@Data}",
            eventName,
            data);
    }

    private void Log(string eventName, QuickScanGuardContext context, IReadOnlyDictionary<string, object?> data) =>
        RecordInternal(eventName, context, data);

    private static string HashForLog(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "empty";

        return Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(value)))
            .Substring(0, 12);
    }
}
