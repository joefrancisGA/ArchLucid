using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

/// <summary>Sealed-manifest guard test doubles for <see cref="PolicyPackGovernanceDryRunService"/>.</summary>
internal static class PolicyPackGovernanceDryRunSealedManifestTestSupport
{
    internal const string SealedManifestHash = "sealed-manifest-hash-for-policy-pack-dry-run-tests";

    internal static ManifestDocument CreateSealedGoldenManifest(ScopeContext scope, Guid runId) =>
        new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ManifestHash = SealedManifestHash,
        };

    internal static IAuthorityQueryService CreateAuthorityQueryService(
        ScopeContext scope,
        Guid runId,
        ManifestDocument? goldenManifest = null)
    {
        ManifestDocument manifest = goldenManifest ?? CreateSealedGoldenManifest(scope, runId);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(query => query.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = manifest,
            });

        return authority.Object;
    }

    internal static IAuthorityQueryService CreateAuthorityQueryServiceForAnyRun(ScopeContext scope) =>
        CreateAuthorityQueryServiceForAnyRun(scope, CreateSealedGoldenManifest(scope, Guid.NewGuid()));

    internal static IAuthorityQueryService CreateAuthorityQueryServiceForAnyRun(
        ScopeContext scope,
        ManifestDocument goldenManifest)
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(query => query.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) => new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = new ManifestDocument
                {
                    ManifestId = goldenManifest.ManifestId,
                    RunId = runId,
                    TenantId = goldenManifest.TenantId,
                    WorkspaceId = goldenManifest.WorkspaceId,
                    ProjectId = goldenManifest.ProjectId,
                    ManifestHash = goldenManifest.ManifestHash,
                },
            });

        return authority.Object;
    }

    internal static IManifestHashService CreateManifestHashService(string? computedHash = null)
    {
        string hash = computedHash ?? SealedManifestHash;

        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns(hash);

        return manifestHash.Object;
    }
}
