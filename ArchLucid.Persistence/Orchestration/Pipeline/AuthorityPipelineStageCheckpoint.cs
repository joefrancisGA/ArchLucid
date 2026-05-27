using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Orchestration.Pipeline;

/// <summary>
///     Stage completion predicates derived from persisted <see cref="RunRecord" /> foreign keys (TB-041).
/// </summary>
public static class AuthorityPipelineStageCheckpoint
{
    /// <summary>Returns <see langword="true" /> when the run header indicates the stage output is already committed.</summary>
    public static bool IsComplete(RunRecord run, string stageName)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentException.ThrowIfNullOrWhiteSpace(stageName);

        return stageName switch
        {
            "context_ingestion" => HasGuid(run.ContextSnapshotId),
            "graph" => HasGuid(run.GraphSnapshotId),
            "findings" => HasGuid(run.FindingsSnapshotId),
            "decisioning" => HasGuid(run.DecisionTraceId) && HasGuid(run.GoldenManifestId),
            "artifacts" => HasGuid(run.ArtifactBundleId),
            _ => throw new ArgumentOutOfRangeException(nameof(stageName), stageName, "Unknown authority pipeline stage.")
        };
    }

    private static bool HasGuid(Guid? value) => value is { } id && id != Guid.Empty;
}
