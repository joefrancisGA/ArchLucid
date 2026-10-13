using ArchLucid.Application.Integration;
using ArchLucid.Core.Manifest;
using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Integration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunIntegrationEventManifestHashResolverTests
{
    [Fact]
    public void ResolvePipelineManifestHashForIntegrationEvent_returns_precomputed_hash_without_authority_query()
    {
        ManifestDocument manifest = new()
        {
            ManifestId = Guid.NewGuid(),
            ManifestHash = "sha256:pipeline-precomputed",
        };

        Mock<IManifestHashService> hashService = new();

        string hash = RunIntegrationEventManifestHashResolver.ResolvePipelineManifestHashForIntegrationEvent(
            manifest,
            hashService.Object);

        hash.Should().Be("sha256:pipeline-precomputed");
        hashService.Verify(x => x.ComputeHash(It.IsAny<ManifestDocument>()), Times.Never);
    }

    [Fact]
    public void ResolvePipelineManifestHashForIntegrationEvent_computes_when_hash_missing()
    {
        ManifestDocument manifest = new() { ManifestId = Guid.NewGuid() };

        Mock<IManifestHashService> hashService = new();
        hashService.Setup(x => x.ComputeHash(manifest)).Returns("sha256:computed");

        string hash = RunIntegrationEventManifestHashResolver.ResolvePipelineManifestHashForIntegrationEvent(
            manifest,
            hashService.Object);

        hash.Should().Be("sha256:computed");
    }
}
