using ArchLucid.Application.Analysis;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
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
public sealed class RunExportPackageBuilderTests
{
    [Fact]
    public async Task BuildAsync_returns_not_found_when_run_missing()
    {
        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(q => q.GetRunDetailAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        RunExportPackageBuilder sut = new(
            authority.Object,
            Mock.Of<IArtifactQueryService>(),
            Mock.Of<IArtifactPackagingService>());

        RunExportPackageResult result = await sut.BuildAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            Guid.NewGuid(),
            renderedDiagramPng: null,
            CancellationToken.None);

        result.Found.Should().BeFalse();
        result.ProblemType.Should().Be("https://archlucid.example.org/errors#run-not-found");
    }

    [Fact]
    public async Task BuildAsync_passes_rendered_png_to_packaging_without_rendering()
    {
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        byte[] png = [0x89, 0x50, 0x4e, 0x47];
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
            .Setup(q => q.GetRunDetailAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = runId },
                GoldenManifest = manifest
            });

        Mock<IArtifactQueryService> artifacts = new();
        artifacts
            .Setup(q => q.GetArtifactsByManifestIdAsync(It.IsAny<ScopeContext>(), manifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<SynthesizedArtifact>());

        Mock<IArtifactPackagingService> packaging = new();
        packaging
            .Setup(p => p.BuildRunExportPackage(
                runId,
                manifestId,
                It.IsAny<IReadOnlyList<SynthesizedArtifact>>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<RunExportReadmeContext?>(),
                png))
            .Returns(new ArtifactPackage
            {
                Content = [0x50, 0x4b],
                ContentType = "application/zip",
                PackageFileName = "export.zip"
            });

        RunExportPackageBuilder sut = new(authority.Object, artifacts.Object, packaging.Object);

        RunExportPackageResult result = await sut.BuildAsync(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() },
            runId,
            png,
            CancellationToken.None);

        result.Found.Should().BeTrue();
        result.ZipContent.Should().Equal([0x50, 0x4b]);
        packaging.VerifyAll();
    }
}
