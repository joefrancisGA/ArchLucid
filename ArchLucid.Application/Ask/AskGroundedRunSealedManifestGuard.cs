using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Ask;

/// <summary>Wave-24 suggestion 231: grounded Ask fail-closed on sealed <see cref="ManifestDocument.ManifestHash"/> and pin/inventory.</summary>
public static class AskGroundedRunSealedManifestGuard
{
    public static void EnsureSingleRunReadyOrThrow(
        Guid runId,
        ManifestDocument manifest,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        string runIdLabel = runId.ToString("D");

        SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(manifest, runIdLabel, manifestHashService);
        EnsureCommittedArtifactInventoryBoundOrThrow(manifest, runIdLabel);
    }

    public static async Task EnsureCompareRunsReadyOrThrowAsync(
        Guid baseRunId,
        Guid targetRunId,
        ManifestDocument baseManifest,
        ManifestDocument targetManifest,
        ScopeContext scope,
        IRunRepository runRepository,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(baseManifest);
        ArgumentNullException.ThrowIfNull(targetManifest);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(runRepository);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        string baseRunIdLabel = baseRunId.ToString("D");
        string targetRunIdLabel = targetRunId.ToString("D");

        SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(baseManifest, baseRunIdLabel, manifestHashService);
        SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(targetManifest, targetRunIdLabel, manifestHashService);

        EnsureCommittedArtifactInventoryBoundOrThrow(baseManifest, baseRunIdLabel);
        EnsureCommittedArtifactInventoryBoundOrThrow(targetManifest, targetRunIdLabel);
        RunRecord? baseHeader = await runRepository.GetByIdAsync(scope, baseRunId, cancellationToken);
        RunRecord? targetHeader = await runRepository.GetByIdAsync(scope, targetRunId, cancellationToken);

        if (baseHeader is null || targetHeader is null)
        {
            throw new ConflictException(
                "Ask compare blocked: one or both runs were not found for pin/inventory verification.");
        }

        RunComparePinFingerprintGuard.EnsureCreateTimePinFingerprintsMatchOrThrow(baseHeader, targetHeader);

        string? baseInventoryHash =
            CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(baseManifest.CommittedArtifactInventory);

        string? targetInventoryHash =
            CommittedArtifactInventoryCompareFingerprint.ComputeHashSha256(targetManifest.CommittedArtifactInventory);

        RunComparePinFingerprintGuard.EnsureCommittedArtifactInventoryFingerprintsMatchOrThrow(
            baseInventoryHash,
            targetInventoryHash);
    }

    private static void EnsureCommittedArtifactInventoryBoundOrThrow(ManifestDocument manifest, string runIdLabel)
    {
        if (manifest.CommittedArtifactInventory.Count == 0)
        {
            throw new ConflictException(
                $"Ask blocked for run '{runIdLabel}': committed artifact inventory is missing.");
        }

        bool hasBundleInventory = manifest.CommittedArtifactInventory
            .Any(row => string.Equals(row.ArtifactName, "artifact-bundle", StringComparison.OrdinalIgnoreCase));

        if (!hasBundleInventory)
        {
            throw new ConflictException(
                $"Ask blocked for run '{runIdLabel}': committed artifact inventory is not inventory-bound.");
        }
    }
}
