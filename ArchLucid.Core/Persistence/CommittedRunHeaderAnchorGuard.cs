using ArchLucid.Persistence.Models;

namespace ArchLucid.Core.Persistence;

/// <summary>
///     App-layer fail-fast guard for committed run-header evidence anchors (TB-310).
/// </summary>
public static class CommittedRunHeaderAnchorGuard
{
    /// <summary>
    ///     When <paramref name="persisted" /> is committed, throws if <paramref name="proposed" /> mutates any anchor
    ///     column.
    /// </summary>
    public static void EnsureAnchorsUnchangedIfCommitted(RunRecord? persisted, RunRecord proposed)
    {
        ArgumentNullException.ThrowIfNull(proposed);

        if (persisted is null || persisted.GoldenManifestId is null)
            return;

        if (HasAnchorMutation(persisted, proposed))
            throw new RunEvidenceAnchorImmutableException(proposed.RunId);
    }

    /// <summary>Returns <see langword="true" /> when any evidence-anchor column differs between the two rows.</summary>
    public static bool HasAnchorMutation(RunRecord persisted, RunRecord proposed)
    {
        ArgumentNullException.ThrowIfNull(persisted);
        ArgumentNullException.ThrowIfNull(proposed);

        if (persisted.RunId != proposed.RunId)
            return true;

        if (persisted.ProjectId != proposed.ProjectId)
            return true;

        if (persisted.TenantId != proposed.TenantId)
            return true;

        if (persisted.WorkspaceId != proposed.WorkspaceId)
            return true;

        if (persisted.ScopeProjectId != proposed.ScopeProjectId)
            return true;

        if (persisted.CreatedUtc != proposed.CreatedUtc)
            return true;

        if (persisted.ContextSnapshotId != proposed.ContextSnapshotId)
            return true;

        if (persisted.GraphSnapshotId != proposed.GraphSnapshotId)
            return true;

        if (persisted.FindingsSnapshotId != proposed.FindingsSnapshotId)
            return true;

        if (persisted.GoldenManifestId != proposed.GoldenManifestId)
            return true;

        if (persisted.DecisionTraceId != proposed.DecisionTraceId)
            return true;

        if (persisted.ArtifactBundleId != proposed.ArtifactBundleId)
            return true;

        if (!string.Equals(persisted.CurrentManifestVersion, proposed.CurrentManifestVersion, StringComparison.Ordinal))
            return true;

        if (persisted.StructuralExecutionMode != proposed.StructuralExecutionMode)
            return true;

        if (!string.Equals(persisted.OtelTraceId, proposed.OtelTraceId, StringComparison.Ordinal))
            return true;

        if (!string.Equals(persisted.EngineProvenanceJson, proposed.EngineProvenanceJson, StringComparison.Ordinal))
            return true;

        if (!string.Equals(persisted.GovernanceScopeJson, proposed.GovernanceScopeJson, StringComparison.Ordinal))
            return true;

        return false;
    }
}
