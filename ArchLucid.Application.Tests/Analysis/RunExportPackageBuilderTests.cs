using ArchLucid.Application.Analysis;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.Scoping;
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
        Mock<IRunExportAuthorityMaterialLoader> materialLoader = new();
        materialLoader
            .Setup(l => l.LoadAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunExportAuthorityMaterialLoadResult.RunNotFound());

        RunExportPackageBuilder sut = new(
            materialLoader.Object,
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
    public async Task BuildAsync_passes_pre_serialized_json_and_png_without_re_serializing()
    {
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        byte[] png = [0x89, 0x50, 0x4e, 0x47];
        const string manifestJson = "{\"manifestId\":\"pre-built\"}";
        const string traceJson = "{\"trace\":\"pre-built\"}";

        Mock<IRunExportAuthorityMaterialLoader> materialLoader = new();
        materialLoader
            .Setup(l => l.LoadAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                RunExportAuthorityMaterialLoadResult.Success(
                    new RunExportAuthorityMaterial
                    {
                        ManifestId = manifestId,
                        ManifestJson = manifestJson,
                        TraceJson = traceJson,
                        ReadmeContext = new RunExportReadmeContext
                        {
                            ManifestDisplayName = "demo",
                            OperatorShellReviewRelativePath = $"/reviews/{runId:D}"
                        }
                    }));

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
                manifestJson,
                traceJson,
                It.IsAny<RunExportReadmeContext?>(),
                png))
            .Returns(new ArtifactPackage
            {
                Content = [0x50, 0x4b],
                ContentType = "application/zip",
                PackageFileName = "export.zip"
            });

        RunExportPackageBuilder sut = new(materialLoader.Object, artifacts.Object, packaging.Object);

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
