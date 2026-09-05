using ArchLucid.Application.Runs;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Analysis;

/// <summary>Wave-23 suggestion 228: temporal graph snapshot compare fail-closed on pin/inventory of both as-of runs.</summary>
public static class GraphSnapshotComparePinInventoryGuard
{
    public static void EnsureTemporalPairPinInventoryReadyOrThrow(
        RunRecord anchorRun,
        RunRecord resolvedRun,
        ManifestDocument? anchorManifest,
        ManifestDocument? resolvedManifest)
    {
        ArgumentNullException.ThrowIfNull(anchorRun);
        ArgumentNullException.ThrowIfNull(resolvedRun);

        if (anchorRun.RunId == resolvedRun.RunId)
            return;

        RunComparePinFingerprintGuard.EnsureCreateTimePinFingerprintsMatchOrThrow(anchorRun, resolvedRun);

        string? anchorInventoryHash = anchorManifest is null
            ? null
            : CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(anchorManifest.CommittedArtifactInventory);

        string? resolvedInventoryHash = resolvedManifest is null
            ? null
            : CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(resolvedManifest.CommittedArtifactInventory);

        RunComparePinFingerprintGuard.EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow(
            anchorInventoryHash,
            resolvedInventoryHash);
    }
}
