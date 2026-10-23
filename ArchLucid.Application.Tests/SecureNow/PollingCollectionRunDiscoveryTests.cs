using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.SecureNow;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

using Azure;

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

    [Fact]
    public async Task DiscoverAsync_continues_when_missing_package_blob_returns_not_found()
    {
        CollectionRunManifest missingPackage = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            ZipPath = "runs/missing/package.zip",
        };

        CollectionRunManifest importable = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            ZipPath = "runs/ok/package.zip",
            SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
        };

        CollectionRunArtifact importableArtifact = new()
        {
            Manifest = importable,
            ZipBytes = [0x50, 0x4B, 0x03, 0x04],
        };

        Mock<ICollectionRunArtifactReader> reader = new();
        reader
            .Setup(r => r.ListManifestsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([missingPackage, importable]);
        reader
            .Setup(r => r.ReadArtifactAsync(missingPackage, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RequestFailedException(404, "Blob not found.", null, null));
        reader
            .Setup(r => r.ReadArtifactAsync(importable, It.IsAny<CancellationToken>()))
            .ReturnsAsync(importableArtifact);

        Mock<ICollectionRunRepository> repository = new();
        repository
            .Setup(r => r.GetAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((CollectionRun?)null);
        repository
            .Setup(r => r.HasImportedHashAsync(It.IsAny<ScopeContext>(), It.IsAny<byte[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        repository
            .Setup(r => r.UpsertAsync(It.IsAny<CollectionRun>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAzureExtractorIngestService> azureIngest = new();
        azureIngest
            .Setup(i => i.IngestZipBytesAsync(
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>(),
                It.IsAny<long>()))
            .ReturnsAsync(new AzureExtractorIngestResult { Succeeded = true, SnapshotId = Guid.NewGuid() });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(p => p.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            });

        CollectionRunIngestService ingest = new(
            repository.Object,
            azureIngest.Object,
            scopeProvider.Object);

        PollingCollectionRunDiscovery discovery = new(reader.Object, ingest);

        int imported = await discovery.DiscoverAsync(CancellationToken.None);

        imported.Should().Be(1);
        azureIngest.Invocations.Count.Should().Be(1);
    }
}
