using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.SecureNow;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class PollingCollectionRunDiscoveryTests
{
    [Fact]
    public async Task DiscoverAsync_skips_ingest_when_artifact_reader_returns_null_for_manifest()
    {
        CollectionRunManifest manifest = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            ZipPath = null,
        };

        Mock<ICollectionRunArtifactReader> reader = new();
        reader
            .Setup(r => r.ListManifestsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([manifest]);
        reader
            .Setup(r => r.ReadArtifactAsync(manifest, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CollectionRunArtifact?)null);

        Mock<ICollectionRunRepository> repository = new(MockBehavior.Strict);
        Mock<IAzureExtractorIngestService> azureIngest = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new(MockBehavior.Strict);

        CollectionRunIngestService ingest = new(
            repository.Object,
            azureIngest.Object,
            scopeProvider.Object);

        PollingCollectionRunDiscovery discovery = new(reader.Object, ingest);

        int imported = await discovery.DiscoverAsync(CancellationToken.None);

        imported.Should().Be(0);
    }
}
