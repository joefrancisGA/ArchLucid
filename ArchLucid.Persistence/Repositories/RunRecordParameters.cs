using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Dapper parameter objects for <c>dbo.Runs</c> writes and scoped lookups.
/// </summary>
/// <remarks>
///     <see cref="RunRecord.StructuralExecutionMode" /> is bound as its NVARCHAR label on both write paths. Dapper would
///     otherwise send the enum's underlying integer, which SQL coerces to values like <c>N'0'</c> and fails
///     <c>CK_Runs_StructuralExecutionMode</c>.
/// </remarks>
internal static class RunRecordParameters
{
    public static object Insert(RunRecord run)
    {
        ArgumentNullException.ThrowIfNull(run);

        return new
        {
            run.RunId,
            run.TenantId,
            run.WorkspaceId,
            run.ScopeProjectId,
            run.ProjectId,
            run.Description,
            run.CreatedUtc,
            run.ContextSnapshotId,
            run.GraphSnapshotId,
            run.FindingsSnapshotId,
            run.GoldenManifestId,
            run.DecisionTraceId,
            run.ArtifactBundleId,
            run.ArchitectureId,
            run.KnowledgeModelId,
            run.ArchivedUtc,
            run.ArchitectureRequestId,
            run.LegacyRunStatus,
            run.CompletedUtc,
            run.CurrentManifestVersion,
            run.OtelTraceId,
            run.IsDemoWelcomeRun,
            run.IsPublicShowcase,
            run.IsSample,
            run.IsPinned,
            run.RealModeFellBackToSimulator,
            run.PilotAoaiDeploymentSnapshot,
            StructuralExecutionMode = run.StructuralExecutionMode.ToString(),
            run.RetryCount,
            run.LastFailureReason,
            run.EngineProvenanceJson,
            run.GovernanceScopeJson,
            run.ImproveLoopEvidenceJson,
            run.PackageOrigin
        };
    }

    /// <remarks>
    ///     Carries <see cref="RunRecord.RowVersion" /> for the optimistic-concurrency predicate; a null stamp means the
    ///     caller never read the row, so a missing update is a "not found" rather than a conflict.
    /// </remarks>
    public static object Update(RunRecord run)
    {
        ArgumentNullException.ThrowIfNull(run);

        return new
        {
            run.RunId,
            run.TenantId,
            run.WorkspaceId,
            run.ScopeProjectId,
            run.ProjectId,
            run.Description,
            run.ContextSnapshotId,
            run.GraphSnapshotId,
            run.FindingsSnapshotId,
            run.GoldenManifestId,
            run.DecisionTraceId,
            run.ArtifactBundleId,
            run.ArchitectureId,
            run.KnowledgeModelId,
            run.ArchivedUtc,
            run.ArchitectureRequestId,
            run.LegacyRunStatus,
            run.CompletedUtc,
            run.CurrentManifestVersion,
            run.IsDemoWelcomeRun,
            run.IsPublicShowcase,
            run.IsSample,
            run.IsPinned,
            run.RealModeFellBackToSimulator,
            run.PilotAoaiDeploymentSnapshot,
            StructuralExecutionMode = run.StructuralExecutionMode.ToString(),
            run.RetryCount,
            run.LastFailureReason,
            run.EngineProvenanceJson,
            run.GovernanceScopeJson,
            run.ImproveLoopEvidenceJson,
            run.PackageOrigin,
            run.RowVersion
        };
    }

    /// <summary>Identity of the row the committed-anchor guard re-reads before an update.</summary>
    public static object AnchorGuardKey(RunRecord run)
    {
        ArgumentNullException.ThrowIfNull(run);

        return new
        {
            run.RunId,
            run.TenantId,
            run.WorkspaceId,
            run.ScopeProjectId
        };
    }

    public static object ForRun(ScopeContext scope, Guid runId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            RunId = runId,
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId
        };
    }

    public static object ForOperatorGovernanceDisposition(
        ScopeContext scope,
        Guid runId,
        string decision,
        string? rationale,
        string actorUserId,
        DateTime occurredUtc)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            RunId = runId,
            scope.TenantId,
            scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            Decision = decision.Trim(),
            Rationale = rationale,
            OccurredUtc = occurredUtc,
            ActorUserId = actorUserId.Trim(),
        };
    }
}
