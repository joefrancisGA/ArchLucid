using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs;

/// <summary>Wave-23 suggestion 221: re-run execute fail-closed unless sealed <see cref="ManifestDocument.ManifestHash"/> and create-time pins still match.</summary>
public static class ReRunExecuteSealedManifestPinGuard
{
    public static async Task EnsureReExecuteSourceReadyOrThrowAsync(
        string runId,
        ScopeContext scope,
        IRunRepository runRepository,
        IAgentResultRepository resultRepository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(runRepository);
        ArgumentNullException.ThrowIfNull(resultRepository);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!Guid.TryParse(runId, out Guid runGuid))
            return;

        RunRecord? header = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (header is null)
            return;

        IReadOnlyList<AgentResult> existingResults =
            await resultRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        if (existingResults.Count == 0)
            return;

        // Incomplete / failed reviews can have agent outputs without a sealed golden manifest.
        // Re-run is the recovery path for those runs; pin/hash/inventory apply only after commit.
        if (!header.GoldenManifestId.HasValue)
            return;

        EnsureCreateTimePinFingerprintsPresentOrThrow(header, runId);

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runGuid, cancellationToken);

        if (detail?.GoldenManifest is null)
        {
            throw new ConflictException(
                $"Re-run execute blocked for run '{runId}': committed golden manifest is missing.");
        }

        ManifestDecisionReceiptExportBinder.EnsureSealedManifestHashMatchesOrThrow(
            detail.GoldenManifest,
            runId,
            manifestHashService);

        EnsureCommittedArtifactInventoryBoundOrThrow(detail.GoldenManifest, runId);
    }

    private static void EnsureCreateTimePinFingerprintsPresentOrThrow(RunRecord header, string runId)
    {
        if (header.PinnedPolicyPackIdsHashSha256 is null or { Length: 0 }
            || header.PinnedEvidencePackagePinsHashSha256 is null or { Length: 0 }
            || header.PinnedArchitectureVersionContentHashSha256 is null or { Length: 0 }
            || header.PinnedKnowledgeModelContentHashSha256 is null or { Length: 0 })
        {
            throw new ConflictException(
                $"Re-run execute blocked for run '{runId}': create-time pin fingerprints are incomplete.");
        }
    }

    private static void EnsureCommittedArtifactInventoryBoundOrThrow(ManifestDocument manifest, string runId)
    {
        if (manifest.CommittedArtifactInventory.Count == 0)
        {
            throw new ConflictException(
                $"Re-run execute blocked for run '{runId}': committed artifact inventory is missing.");
        }

        bool hasBundleInventory = manifest.CommittedArtifactInventory
            .Any(row => string.Equals(row.ArtifactName, "artifact-bundle", StringComparison.OrdinalIgnoreCase));

        if (!hasBundleInventory)
        {
            throw new ConflictException(
                $"Re-run execute blocked for run '{runId}': committed artifact inventory is not inventory-bound.");
        }
    }
}
