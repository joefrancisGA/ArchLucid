using ArchLucid.Application.Analysis;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class RunExportAuthorityMaterialLoaderTests
{
    [Fact]
    public async Task LoadAsync_serializes_manifest_and_trace_once_into_material()
    {
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        ManifestDocument manifest = new()
        {
            ManifestId = manifestId,
            Metadata = new ManifestMetadata { Name = "demo" },
            ManifestHash = "abc",
            RuleSetId = "rs",
            RuleSetVersion = "1"
        };

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForExportAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = manifest,
                AuthorityTrace = null
            });

        RunExportAuthorityMaterialLoader sut = new(authority.Object);

        RunExportAuthorityMaterialLoadResult result = await sut.LoadAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            runId,
            CancellationToken.None);

        result.RunFound.Should().BeTrue();
        result.ManifestFound.Should().BeTrue();
        result.Material.Should().NotBeNull();
        result.Material!.ManifestId.Should().Be(manifestId);
        result.Material.ManifestJson.Should().Contain("demo");
        result.Material.TraceJson.Should().BeNull();
        result.Material.ReadmeContext.ManifestDisplayName.Should().Be("demo");
    }

    [Fact]
    public async Task LoadAsync_returns_run_not_found_when_authority_misses()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailForExportAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        RunExportAuthorityMaterialLoader sut = new(authority.Object);

        RunExportAuthorityMaterialLoadResult result = await sut.LoadAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            Guid.NewGuid(),
            CancellationToken.None);

        result.RunFound.Should().BeFalse();
        result.Material.Should().BeNull();
    }
}
