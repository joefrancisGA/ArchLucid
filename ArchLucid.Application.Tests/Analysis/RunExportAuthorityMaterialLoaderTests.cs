using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Tests.Exports;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class RunExportAuthorityMaterialLoaderTests
{
    [Fact]
    public async Task LoadAsync_serializes_a_sealed_manifest_without_inventing_an_absent_trace()
    {
        Guid runId = Guid.NewGuid();
        ManifestHashService hashes = new();
        Mock<IAuthorityQueryService> authority = new();
        ManifestDocument manifest = SealedExportReceiptTestSupport.ConfigureVerifiedSealedExport(authority, runId, hashes);
        authority.Setup(q => q.GetRunDetailForExportAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord
                {
                    RunId = runId,
                    GoldenManifestId = manifest.ManifestId,
                    LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
                },
                GoldenManifest = manifest,
            });
        RunExportAuthorityMaterialLoader sut = new(authority.Object, hashes);

        RunExportAuthorityMaterialLoadResult result = await sut.LoadAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            runId,
            CancellationToken.None);

        result.RunFound.Should().BeTrue();
        result.ManifestFound.Should().BeTrue();
        result.Material.Should().NotBeNull();
        result.Material!.ManifestId.Should().Be(manifest.ManifestId);
        using JsonDocument manifestJson = JsonDocument.Parse(result.Material.ManifestJson);
        manifestJson.RootElement.GetProperty("runId").GetGuid().Should().Be(runId);
        manifestJson.RootElement.GetProperty("metadata").GetProperty("version").GetString().Should().Be("v1");
        result.Material.TraceJson.Should().BeNull();
        result.Material.ReadmeContext.ManifestDisplayName.Should().Be("ArchLucid Manifest");
    }

    [Fact]
    public async Task LoadAsync_returns_run_not_found_when_authority_misses()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForExportAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        RunExportAuthorityMaterialLoader sut = new(authority.Object, new ManifestHashService());

        RunExportAuthorityMaterialLoadResult result = await sut.LoadAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            Guid.NewGuid(),
            CancellationToken.None);

        result.RunFound.Should().BeFalse();
        result.Material.Should().BeNull();
    }
}
