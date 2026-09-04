using ArchLucid.Contracts.Metadata;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Analysis;

/// <summary>Wave-22 suggestion 211: batch replay fail-closed when E2E pairs lack pin/inventory fingerprints.</summary>
internal static class ComparisonBatchReplayPinInventoryGuard
{
    public static async Task EnsureEndToEndReplayPairReadyOrThrowAsync(
        ComparisonRecord record,
        string? replayMode,
        ICompareRunsApplicationFacade compareRunsFacade,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);
        ArgumentNullException.ThrowIfNull(compareRunsFacade);

        if (!string.Equals(record.ComparisonType, ComparisonTypes.EndToEndReplay, StringComparison.Ordinal))
            return;

        ComparisonReplayMode mode = ComparisonReplayRequestParsing.ParseReplayMode(replayMode);

        if (mode == ComparisonReplayMode.ArtifactReplay)
            return;

        if (string.IsNullOrWhiteSpace(record.LeftRunId) || string.IsNullOrWhiteSpace(record.RightRunId))
        {
            throw new ConflictException(
                $"Batch replay blocked for comparison '{record.ComparisonRecordId}': end-to-end record is missing LeftRunId/RightRunId required for pin/inventory-checked regenerate.");
        }

        ScopedRunPairLoadResult loadResult =
            await compareRunsFacade.LoadScopedRunPairAsync(record.LeftRunId, record.RightRunId, cancellationToken);

        switch (loadResult.Outcome)
        {
            case ScopedRunPairLoadOutcome.Success:
                return;
            case ScopedRunPairLoadOutcome.PinFingerprintMismatch:
                throw new ConflictException(
                    "Batch replay blocked: create-time pin fingerprints differ between the selected runs.");
            case ScopedRunPairLoadOutcome.CommittedArtifactInventoryMismatch:
                throw new ConflictException(
                    "Batch replay blocked: committed artifact inventory fingerprints differ between the selected runs.");
            default:
                throw new ConflictException(
                    $"Batch replay blocked for comparison '{record.ComparisonRecordId}': run pair is not inventory-checked ({loadResult.Outcome}).");
        }
    }
}
