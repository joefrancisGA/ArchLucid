using ArchLucid.Core.QuickScan;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Architecture;

public sealed partial class QuickScanExecutionOrchestrator
{
    private async Task RecordUsageAsync(
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
        CancellationToken cancellationToken)
    {
        try
        {
            QuickScanUsageRecord record = QuickScanUsageRecordFactory.Create(
                guardContext,
                requestContext,
                status,
                reservationId,
                reservedUsd,
                actualCostUsd,
                inputTokens,
                outputTokens,
                modelLabel,
                rejectionReason,
                duration,
                timeProvider.GetUtcNow());

            await _quickScanUsageRecorder.RecordAsync(record, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Quick Scan usage record persistence failed for status {Status}.", status);
        }
    }
}
