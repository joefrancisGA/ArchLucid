using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>
///     Wave-13 suggestion 130: detect partially completed commits before retrying seal.
/// </summary>
public static class AuthorityCommitRecoveryVerifier
{
    public static void EnsureRecoverableOrThrow(ArchitectureRun run, RunRecord header, string runIdLabel)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(header);
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);

        if (run.GoldenManifestId.HasValue && run.Status != ArchitectureRunStatus.Committed)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': golden manifest id is set but run status is {run.Status}.");
        }

        if (run.Status is ArchitectureRunStatus.ReadyForCommit
            or ArchitectureRunStatus.WaitingForResults
            or ArchitectureRunStatus.TasksGenerated
            or ArchitectureRunStatus.Retrying
            or ArchitectureRunStatus.PartiallyCompleted)
        {
            bool missingPipelineSnapshots = header.ContextSnapshotId is null
                || header.GraphSnapshotId is null
                || header.FindingsSnapshotId is null;

            if (missingPipelineSnapshots && header.GoldenManifestId.HasValue)
            {
                throw new ConflictException(
                    $"Commit recovery blocked for run '{runIdLabel}': golden manifest id is set but pipeline snapshot ids are incomplete.");
            }
        }

        if (header.GoldenManifestId.HasValue
            && run.GoldenManifestId.HasValue
            && header.GoldenManifestId != run.GoldenManifestId)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': run header and architecture run golden manifest ids diverge.");
        }
    }

    /// <summary>Wave-14 suggestion 139 / wave-15 suggestion 143: verify sealed inventory rows match persisted snapshot pointers and recomputed hashes.</summary>
    public static void EnsureInventoryConsistentOrThrow(
        ManifestDocument? persistedManifest,
        RunRecord header,
        string runIdLabel,
        ManifestCommittedArtifactInventoryMaterial? recomputedMaterial = null)
    {
        ArgumentNullException.ThrowIfNull(header);
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);

        if (!header.GoldenManifestId.HasValue)
            return;

        if (persistedManifest is null)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': golden manifest id is set but the manifest row is missing.");
        }

        ManifestCommittedArtifactInventoryCapturer.EnsureStoredInventoryMatchesPointersOrThrow(
            persistedManifest,
            header,
            runIdLabel);

        ManifestCommittedArtifactInventoryCapturer.EnsureDecisionTraceInventoryRowPresentOrThrow(
            persistedManifest,
            runIdLabel);

        if (recomputedMaterial is null)
        {
            throw new ConflictException(
                $"Commit recovery blocked for run '{runIdLabel}': recomputed artifact inventory material is required.");
        }

        ManifestCommittedArtifactInventoryCapturer.EnsureStoredInventoryContentHashesMatchOrThrow(
            persistedManifest,
            recomputedMaterial,
            runIdLabel);
    }

    /// <summary>Wave-18 suggestion 178 / wave-19 suggestion 188: verify sealed decision receipt hash and manifest hash.</summary>
    public static void EnsureDecisionReceiptHashConsistentOrThrow(
        ManifestDocument persistedManifest,
        Guid runId,
        string manifestVersion,
        string runIdLabel,
        IManifestHashService manifestHashService)
    {
        EnsureSealedManifestHashMatchesOrThrow(
            persistedManifest,
            runIdLabel,
            manifestHashService);

        ManifestDecisionReceiptExportBinder.EnsureSealedReceiptHashMatchesOrThrow(
            runId,
            persistedManifest,
            manifestVersion,
            runIdLabel,
            manifestHashService);
    }

    /// <summary>Wave-19 suggestion 188: verify sealed manifest hash without mutating receipt fields.</summary>
    public static void EnsureSealedManifestHashMatchesOrThrow(
        ManifestDocument persistedManifest,
        string runIdLabel,
        IManifestHashService manifestHashService)
    {
        ManifestDecisionReceiptExportBinder.EnsureSealedManifestHashMatchesOrThrow(
            persistedManifest,
            runIdLabel,
            manifestHashService);
    }
}
