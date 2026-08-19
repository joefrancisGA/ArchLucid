using ArchLucid.Core.QuickScan;

namespace ArchLucid.Application.Architecture;

/// <summary>Builds privacy-minimized Quick Scan usage rows for durable monitoring (TB-899).</summary>
internal static class QuickScanUsageRecordFactory
{
    public static QuickScanUsageRecord Create(
        QuickScanGuardContext guardContext,
        QuickScanExecutionRequestContext requestContext,
        string status,
        Guid? reservationId,
        decimal? reservedUsd,
        decimal? actualCostUsd,
        int? inputTokens,
        int? outputTokens,
        string? modelLabel,
        string? rejectionReason,
        TimeSpan duration,
        DateTimeOffset occurredUtc)
    {
        return new QuickScanUsageRecord
        {
            Status = status,
            RouteKind = requestContext.RequiresAnonymousDistributedConcurrency ? "marketing" : "authenticated",
            ReservationId = reservationId,
            ClientIpHash = QuickScanUsageRecorder.HashIdentity(guardContext.ClientIp),
            SessionIdHash = QuickScanUsageRecorder.HashIdentity(guardContext.SessionId),
            ReservedUsd = reservedUsd,
            ActualCostUsd = actualCostUsd,
            InputTokens = inputTokens,
            OutputTokens = outputTokens,
            ModelLabel = modelLabel,
            RejectionReason = rejectionReason,
            DurationMs = (int)duration.TotalMilliseconds,
            OccurredUtc = occurredUtc,
        };
    }
}
