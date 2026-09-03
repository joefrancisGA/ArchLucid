using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
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
}
