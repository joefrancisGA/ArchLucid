using ArchLucid.Contracts.Common;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Core.Runs;

/// <summary>Exact scope and sealed evidence anchor checks for system-owned committed-run work.</summary>
public static class CommittedRunEvidenceBinding
{
    public static bool HasExplicitScope(ScopeContext scope) =>
        scope.TenantId != Guid.Empty && scope.WorkspaceId != Guid.Empty && scope.ProjectId != Guid.Empty;

    public static bool MatchesDrainScope(ScopeContext scope, ScopeContext? drainScope) =>
        drainScope is null ||
        ((drainScope.TenantId == Guid.Empty || drainScope.TenantId == scope.TenantId) &&
         (drainScope.WorkspaceId == Guid.Empty || drainScope.WorkspaceId == scope.WorkspaceId) &&
         (drainScope.ProjectId == Guid.Empty || drainScope.ProjectId == scope.ProjectId));

    public static bool MatchesActiveRun(ScopeContext scope, Guid runId, RunRecord? run) =>
        HasExplicitScope(scope) && runId != Guid.Empty && run is not null && run.RunId == runId &&
        run.ArchivedUtc is null && run.TenantId == scope.TenantId && run.WorkspaceId == scope.WorkspaceId &&
        run.ScopeProjectId == scope.ProjectId;

    public static bool MatchesRun(ScopeContext scope, Guid runId, RunRecord? run) =>
        MatchesActiveRun(scope, runId, run) &&
        AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(run!) == AuthorityRunLifecyclePhase.Complete;

    public static bool MatchesManifest(ScopeContext scope, RunRecord run, ManifestDocument manifest) =>
        manifest.ManifestId != Guid.Empty && manifest.ManifestId == run.GoldenManifestId &&
        manifest.RunId == run.RunId && manifest.TenantId == scope.TenantId &&
        manifest.WorkspaceId == scope.WorkspaceId && manifest.ProjectId == scope.ProjectId &&
        manifest.GraphSnapshotId == run.GraphSnapshotId.GetValueOrDefault() &&
        manifest.FindingsSnapshotId == run.FindingsSnapshotId.GetValueOrDefault() &&
        manifest.DecisionTraceId == run.DecisionTraceId.GetValueOrDefault();
}
