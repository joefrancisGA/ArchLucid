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
        Guid tenantId = Guid.NewGuid();
        CollectionRunManifest missingPackage = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            TenantId = tenantId,
            ZipPath = "runs/missing/package.zip",
        };

        CollectionRunManifest importable = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            TenantId = tenantId,
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
                TenantId = tenantId,
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

    [Fact]
    public async Task DiscoverAsync_continues_when_package_blob_download_returns_storage_error()
    {
        Guid tenantId = Guid.NewGuid();
        CollectionRunManifest unavailablePackage = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            TenantId = tenantId,
            ZipPath = "runs/unavailable/package.zip",
        };

        CollectionRunManifest importable = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            TenantId = tenantId,
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
            .ReturnsAsync([unavailablePackage, importable]);
        reader
            .Setup(r => r.ReadArtifactAsync(unavailablePackage, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RequestFailedException(503, "Service unavailable.", null, null));
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
                TenantId = tenantId,
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
    }

    [Fact]
    public async Task DiscoverAsync_continues_when_ingest_throws_for_one_manifest()
    {
        Guid tenantId = Guid.NewGuid();
        CollectionRunManifest failing = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            TenantId = tenantId,
            ZipPath = "runs/fail/package.zip",
            SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
        };

        CollectionRunManifest importable = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            TenantId = tenantId,
            ZipPath = "runs/ok/package.zip",
            SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
        };

        CollectionRunArtifact failingArtifact = new()
        {
            Manifest = failing,
            ZipBytes = [0x00],
        };

        CollectionRunArtifact importableArtifact = new()
        {
            Manifest = importable,
            ZipBytes = [0x50, 0x4B, 0x03, 0x04],
        };

        Mock<ICollectionRunArtifactReader> reader = new();
        reader
            .Setup(r => r.ListManifestsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([failing, importable]);
        reader
            .Setup(r => r.ReadArtifactAsync(failing, It.IsAny<CancellationToken>()))
            .ReturnsAsync(failingArtifact);
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
            .SetupSequence(i => i.IngestZipBytesAsync(
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>(),
                It.IsAny<long>()))
            .ThrowsAsync(new InvalidOperationException("Simulated ingest failure."))
            .ReturnsAsync(new AzureExtractorIngestResult { Succeeded = true, SnapshotId = Guid.NewGuid() });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(p => p.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = tenantId,
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
        azureIngest.Invocations.Count.Should().Be(2);
    }

    [Fact]
    public async Task DiscoverAsync_does_not_count_running_manifest_as_imported()
    {
        CollectionRunManifest running = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Running",
            ZipPath = "runs/in-progress/package.zip",
            SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
        };

        CollectionRunArtifact artifact = new()
        {
            Manifest = running,
            ZipBytes = [0x50, 0x4B, 0x03, 0x04],
        };

        Mock<ICollectionRunArtifactReader> reader = new();
        reader
            .Setup(r => r.ListManifestsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([running]);
        reader
            .Setup(r => r.ReadArtifactAsync(running, It.IsAny<CancellationToken>()))
            .ReturnsAsync(artifact);

        Mock<ICollectionRunRepository> repository = new();
        repository
            .Setup(r => r.GetAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((CollectionRun?)null);
        repository
            .Setup(r => r.UpsertAsync(It.IsAny<CollectionRun>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAzureExtractorIngestService> azureIngest = new(MockBehavior.Strict);
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

        imported.Should().Be(0);
        azureIngest.Invocations.Should().BeEmpty();
    }

    [Fact]
    public async Task DiscoverAsync_does_not_count_empty_package_zip_as_imported()
    {
        CollectionRunManifest manifest = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            ZipPath = "runs/empty/package.zip",
            SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
        };

        CollectionRunArtifact emptyArtifact = new()
        {
            Manifest = manifest,
            ZipBytes = [],
        };

        Mock<ICollectionRunArtifactReader> reader = new();
        reader
            .Setup(r => r.ListManifestsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([manifest]);
        reader
            .Setup(r => r.ReadArtifactAsync(manifest, It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyArtifact);

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
        azureIngest.Invocations.Should().BeEmpty();
    }

    [Fact]
    public async Task DiscoverAsync_does_not_increment_import_count_when_ingest_returns_rejected_status()
    {
        Guid tenantId = Guid.NewGuid();
        CollectionRunManifest rejected = new()
        {
            RunId = Guid.NewGuid(),
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            TenantId = tenantId,
            ZipPath = "runs/bad-schema/package.zip",
            SchemaVersion = -1,
        };

        CollectionRunArtifact artifact = new()
        {
            Manifest = rejected,
            ZipBytes = [0x50, 0x4B, 0x03, 0x04],
        };

        Mock<ICollectionRunArtifactReader> reader = new();
        reader
            .Setup(r => r.ListManifestsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([rejected]);
        reader
            .Setup(r => r.ReadArtifactAsync(rejected, It.IsAny<CancellationToken>()))
            .ReturnsAsync(artifact);

        Mock<ICollectionRunRepository> repository = new();
        repository
            .Setup(r => r.GetAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((CollectionRun?)null);
        repository
            .Setup(r => r.UpsertAsync(It.IsAny<CollectionRun>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAzureExtractorIngestService> azureIngest = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(p => p.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            });

        CollectionRunIngestService ingest = new(
            repository.Object,
            azureIngest.Object,
            scopeProvider.Object);

        PollingCollectionRunDiscovery discovery = new(reader.Object, ingest);

        int imported = await discovery.DiscoverAsync(CancellationToken.None);

        imported.Should().Be(0);
        azureIngest.Invocations.Should().BeEmpty();
    }

    [Fact]
    public async Task DiscoverAsync_counts_duplicate_runId_manifest_once_per_batch()
    {
        Guid tenantId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        CollectionRunManifest first = new()
        {
            RunId = runId,
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            TenantId = tenantId,
            ZipPath = "runs/a/package.zip",
            SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
        };

        CollectionRunManifest duplicate = new()
        {
            RunId = runId,
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            TenantId = tenantId,
            ZipPath = "runs/b/package.zip",
            SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
        };

        CollectionRunArtifact artifact = new()
        {
            Manifest = first,
            ZipBytes = [0x50, 0x4B, 0x03, 0x04],
        };

        Mock<ICollectionRunArtifactReader> reader = new();
        reader
            .Setup(r => r.ListManifestsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([first, duplicate]);
        reader
            .Setup(r => r.ReadArtifactAsync(first, It.IsAny<CancellationToken>()))
            .ReturnsAsync(artifact);
        reader
            .Setup(r => r.ReadArtifactAsync(duplicate, It.IsAny<CancellationToken>()))
            .ReturnsAsync(artifact);

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
                TenantId = tenantId,
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

    [Fact]
    public async Task DiscoverAsync_tries_later_duplicate_runId_when_earlier_manifest_has_empty_zip()
    {
        Guid tenantId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        CollectionRunManifest emptyZipFirst = new()
        {
            RunId = runId,
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            TenantId = tenantId,
            ZipPath = "runs/a/empty.zip",
            SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
        };

        CollectionRunManifest validSecond = new()
        {
            RunId = runId,
            AgentVersion = "1.0",
            StartedUtc = DateTime.UtcNow,
            Status = "Succeeded",
            TenantId = tenantId,
            ZipPath = "runs/b/package.zip",
            SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
        };

        CollectionRunArtifact emptyArtifact = new() { Manifest = emptyZipFirst, ZipBytes = [] };
        CollectionRunArtifact validArtifact = new()
        {
            Manifest = validSecond,
            ZipBytes = [0x50, 0x4B, 0x03, 0x04],
        };

        Mock<ICollectionRunArtifactReader> reader = new();
        reader
            .Setup(r => r.ListManifestsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([emptyZipFirst, validSecond]);
        reader
            .Setup(r => r.ReadArtifactAsync(emptyZipFirst, It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyArtifact);
        reader
            .Setup(r => r.ReadArtifactAsync(validSecond, It.IsAny<CancellationToken>()))
            .ReturnsAsync(validArtifact);

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
                TenantId = tenantId,
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

    [Fact]
    public async Task DiscoverAsync_propagates_operation_canceled_when_list_manifests_is_canceled()
    {
        using CancellationTokenSource cts = new();
        cts.Cancel();

        Mock<ICollectionRunArtifactReader> reader = new();
        reader
            .Setup(r => r.ListManifestsAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException(cts.Token));

        Mock<ICollectionRunRepository> repository = new(MockBehavior.Strict);
        Mock<IAzureExtractorIngestService> azureIngest = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new(MockBehavior.Strict);

        CollectionRunIngestService ingest = new(
            repository.Object,
            azureIngest.Object,
            scopeProvider.Object);

        PollingCollectionRunDiscovery discovery = new(reader.Object, ingest);

        Func<Task> act = () => discovery.DiscoverAsync(cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task DiscoverAsync_returns_zero_when_list_manifests_throws()
    {
        Mock<ICollectionRunArtifactReader> reader = new();
        reader
            .Setup(r => r.ListManifestsAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Simulated storage list failure."));

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
