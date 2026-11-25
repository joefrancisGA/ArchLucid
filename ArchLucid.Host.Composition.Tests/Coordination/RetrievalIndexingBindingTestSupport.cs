using ArchLucid.Contracts.Common;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Coordination;

internal static class RetrievalIndexingBindingTestSupport
{
    public static RunRecord CreateCommittedRun(ManifestDocument manifest) => new()
    {
        RunId = manifest.RunId,
        TenantId = manifest.TenantId,
        WorkspaceId = manifest.WorkspaceId,
        ScopeProjectId = manifest.ProjectId,
        GoldenManifestId = manifest.ManifestId,
        GraphSnapshotId = manifest.GraphSnapshotId == Guid.Empty ? null : manifest.GraphSnapshotId,
        FindingsSnapshotId = manifest.FindingsSnapshotId == Guid.Empty ? null : manifest.FindingsSnapshotId,
        DecisionTraceId = manifest.DecisionTraceId == Guid.Empty ? null : manifest.DecisionTraceId,
        LegacyRunStatus = nameof(ArchitectureRunStatus.Committed)
    };

    public static void RegisterCommittedRun(ServiceCollection services, ManifestDocument manifest)
    {
        RunRecord run = CreateCommittedRun(manifest);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.GetByIdIncludingArchivedAsync(
                It.Is<ScopeContext>(s => SameScope(s, manifest)), run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);
        services.AddScoped(_ => runs.Object);
    }

    public static void SetupManifest(Mock<IAuthorityQueryService> query, ManifestDocument manifest) =>
        query.Setup(q => q.GetManifestForSummaryVerificationAsync(
                It.Is<ScopeContext>(s => SameScope(s, manifest)), manifest.ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(manifest);

    private static bool SameScope(ScopeContext scope, ManifestDocument manifest) =>
        scope.TenantId == manifest.TenantId && scope.WorkspaceId == manifest.WorkspaceId &&
        scope.ProjectId == manifest.ProjectId;
}
