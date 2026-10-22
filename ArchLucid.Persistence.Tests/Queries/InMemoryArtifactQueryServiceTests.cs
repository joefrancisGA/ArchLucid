using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Moq;

namespace ArchLucid.Persistence.Tests.Queries;

[Trait("Category", "Unit")]
public sealed class InMemoryArtifactQueryServiceTests
{
    [Fact]
    public async Task ListArtifactsByManifestIdAsync_returns_ordered_descriptors_without_bodies()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid manifestId = Guid.NewGuid();
        Guid secondArtifactId = Guid.NewGuid();
        Guid firstArtifactId = Guid.NewGuid();

        ArtifactBundle bundle = new()
        {
            ManifestId = manifestId,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactId = secondArtifactId,
                    ArtifactType = "b",
                    Name = "beta",
                    RunId = Guid.NewGuid(),
                    ManifestId = manifestId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    Format = "json",
                    Content = "{}",
                    ContentHash = "h2",
                },
                new SynthesizedArtifact
                {
                    ArtifactId = firstArtifactId,
                    ArtifactType = "a",
                    Name = "alpha",
                    RunId = Guid.NewGuid(),
                    ManifestId = manifestId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    Format = "json",
                    Content = "{}",
                    ContentHash = "h1",
                },
            ],
        };

        Mock<IArtifactBundleRepository> bundles = new();
        bundles
            .Setup(b => b.GetByManifestIdAsync(scope, manifestId, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(bundle);

        InMemoryArtifactQueryService sut = new(bundles.Object);

        IReadOnlyList<ArtifactDescriptor> descriptors =
            await sut.ListArtifactsByManifestIdAsync(scope, manifestId, CancellationToken.None);

        descriptors.Select(d => d.ArtifactId).Should().Equal(firstArtifactId, secondArtifactId);
        bundles.Verify(
            b => b.GetByManifestIdAsync(scope, manifestId, false, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetArtifactByIdAsync_loads_bodies_and_returns_match()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Guid manifestId = Guid.NewGuid();
        Guid artifactId = Guid.NewGuid();
        SynthesizedArtifact artifact = new() { ArtifactId = artifactId, ArtifactType = "diagram" };

        Mock<IArtifactBundleRepository> bundles = new();
        bundles
            .Setup(b => b.GetByManifestIdAsync(scope, manifestId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArtifactBundle { ManifestId = manifestId, Artifacts = [artifact] });

        InMemoryArtifactQueryService sut = new(bundles.Object);

        SynthesizedArtifact? found =
            await sut.GetArtifactByIdAsync(scope, manifestId, artifactId, CancellationToken.None);

        found.Should().BeSameAs(artifact);
    }

    [Fact]
    public async Task GetArtifactsByManifestIdAsync_returns_empty_when_bundle_missing()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid manifestId = Guid.NewGuid();

        Mock<IArtifactBundleRepository> bundles = new();
        bundles
            .Setup(b => b.GetByManifestIdAsync(scope, manifestId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArtifactBundle?)null);

        InMemoryArtifactQueryService sut = new(bundles.Object);

        IReadOnlyList<SynthesizedArtifact> artifacts =
            await sut.GetArtifactsByManifestIdAsync(scope, manifestId, CancellationToken.None);

        artifacts.Should().BeEmpty();
    }
}
