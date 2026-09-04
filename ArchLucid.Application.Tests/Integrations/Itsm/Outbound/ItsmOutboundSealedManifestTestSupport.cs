using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

/// <summary>Wave-24 ITSM outbound guard test doubles for sealed golden manifests.</summary>
internal static class ItsmOutboundSealedManifestTestSupport
{
    internal const string SealedManifestHash = "sealed-manifest-hash-for-itsm-outbound-tests";

    internal static ManifestDocument CreateSealedGoldenManifest(ScopeContext scope, Guid runId) =>
        new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ManifestHash = SealedManifestHash,
            CommittedArtifactInventory =
            [
                new CommittedArtifactInventoryEntry
                {
                    ArtifactName = "artifact-bundle",
                    ContentHashSha256 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
                    ContentType = "application/octet-stream",
                    Producer = "test",
                    CapturedUtc = DateTime.UtcNow,
                },
            ],
        };

    internal static IAuthorityQueryService CreateAuthorityQueryService(ScopeContext scope, Guid runId)
    {
        ManifestDocument goldenManifest = CreateSealedGoldenManifest(scope, runId);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(query => query.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = goldenManifest,
            });

        return authority.Object;
    }

    internal static IManifestHashService CreateManifestHashService()
    {
        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns<ManifestDocument>(manifest => manifest.ManifestHash ?? SealedManifestHash);

        return manifestHash.Object;
    }
}
