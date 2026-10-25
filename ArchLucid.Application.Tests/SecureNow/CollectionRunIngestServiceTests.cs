using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.SecureNow;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CollectionRunIngestServiceTests
{
    private static readonly Guid TestTenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public async Task NewHashImportsOneSnapshot()
    {
        Guid runId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        Mock<ICollectionRunRepository> repository = CreateRepository(false);
        Mock<IAzureExtractorIngestService> importer = CreateImporter(snapshotId);
        CollectionRunIngestService service = CreateService(repository, importer);

        CollectionRun result = await service.IngestAsync(CreateArtifact(runId));

        result.Status.Should().Be(CollectionRunStatus.Imported);
        result.ImportedSnapshotId.Should().Be(snapshotId);
        importer.Verify(
            item => item.IngestZipBytesAsync(
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                null,
                It.IsAny<CancellationToken>(),
                null,
                It.IsAny<long>()),
            Times.Once);
    }

    [Fact]
    public async Task ExistingHashDoesNotImportAgain()
    {
        Guid runId = Guid.NewGuid();
        Mock<ICollectionRunRepository> repository = CreateRepository(true);
        Mock<IAzureExtractorIngestService> importer = new();
        CollectionRunIngestService service = CreateService(repository, importer);

        CollectionRun result = await service.IngestAsync(CreateArtifact(runId));

        result.Status.Should().Be(CollectionRunStatus.Imported);
        importer.Verify(
            item => item.IngestZipBytesAsync(
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                null,
                It.IsAny<CancellationToken>(),
                null,
                It.IsAny<long>()),
            Times.Never);
    }

    [Fact]
    public async Task ManifestWithoutTenantIdRejectsWithoutImport()
    {
        Guid runId = Guid.NewGuid();
        Mock<ICollectionRunRepository> repository = CreateRepository(false);
        repository
            .Setup(item => item.UpsertAsync(It.IsAny<CollectionRun>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IAzureExtractorIngestService> importer = new();
        CollectionRunIngestService service = CreateService(repository, importer);

        CollectionRunArtifact artifact = new()
        {
            Manifest = new CollectionRunManifest
            {
                RunId = runId,
                AgentVersion = "test",
                StartedUtc = DateTime.UtcNow,
                Status = "Succeeded",
                SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
            },
            ZipBytes = [1, 2, 3],
        };

        CollectionRun result = await service.IngestAsync(artifact);

        result.Status.Should().Be(CollectionRunStatus.Rejected);
        result.ErrorSummary.Should().Contain("tenant identifier");
        importer.Invocations.Should().BeEmpty();
    }

    [Fact]
    public async Task ManifestPackageHashMismatchRejectsWithoutImport()
    {
        Guid runId = Guid.NewGuid();
        Mock<ICollectionRunRepository> repository = CreateRepository(false);
        repository
            .Setup(item => item.UpsertAsync(It.IsAny<CollectionRun>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IAzureExtractorIngestService> importer = new();
        CollectionRunIngestService service = CreateService(repository, importer);

        CollectionRunArtifact artifact = new()
        {
            Manifest = new CollectionRunManifest
            {
                RunId = runId,
                AgentVersion = "test",
                StartedUtc = DateTime.UtcNow,
                Status = "Succeeded",
                TenantId = TestTenantId,
                ZipSha256 = new string('g', 64),
                SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
            },
            ZipBytes = [0x50, 0x4B, 0x03, 0x04],
        };

        CollectionRun result = await service.IngestAsync(artifact);

        result.Status.Should().Be(CollectionRunStatus.Rejected);
        result.ErrorSummary.Should().Contain("hash");
        importer.Invocations.Should().BeEmpty();
    }

    [Fact]
    public async Task RunningManifestRejectsWithoutImport()
    {
        Guid runId = Guid.NewGuid();
        Mock<ICollectionRunRepository> repository = CreateRepository(false);
        repository
            .Setup(item => item.UpsertAsync(It.IsAny<CollectionRun>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IAzureExtractorIngestService> importer = new();
        CollectionRunIngestService service = CreateService(repository, importer);

        CollectionRunArtifact artifact = new()
        {
            Manifest = new CollectionRunManifest
            {
                RunId = runId,
                AgentVersion = "test",
                StartedUtc = DateTime.UtcNow,
                Status = "Running",
                SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
            },
            ZipBytes = [1, 2, 3],
        };

        CollectionRun result = await service.IngestAsync(artifact);

        result.Status.Should().Be(CollectionRunStatus.Rejected);
        result.ErrorSummary.Should().Contain("importable terminal status");
        importer.Invocations.Should().BeEmpty();
    }

    [Fact]
    public async Task UnsupportedSchemaRejectsWithoutImport()
    {
        Guid runId = Guid.NewGuid();
        Mock<ICollectionRunRepository> repository = CreateRepository(false);
        Mock<IAzureExtractorIngestService> importer = new();
        CollectionRunIngestService service = CreateService(repository, importer);

        CollectionRunArtifact artifact = new()
        {
            Manifest = new CollectionRunManifest
            {
                RunId = runId,
                AgentVersion = "test",
                StartedUtc = DateTime.UtcNow,
                Status = "Succeeded",
                TenantId = TestTenantId,
                SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion + 1,
            },
            ZipBytes = [1, 2, 3],
        };

        CollectionRun result = await service.IngestAsync(artifact);

        result.Status.Should().Be(CollectionRunStatus.Rejected);
        importer.Verify(
            item => item.IngestZipBytesAsync(
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                null,
                It.IsAny<CancellationToken>(),
                null,
                It.IsAny<long>()),
            Times.Never);
    }

    private static CollectionRunArtifact CreateArtifact(Guid runId) =>
        new()
        {
            Manifest = new CollectionRunManifest
            {
                RunId = runId,
                AgentVersion = "test",
                StartedUtc = DateTime.UtcNow,
                Status = "Succeeded",
                TenantId = TestTenantId,
                SchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion,
            },
            ZipBytes = [1, 2, 3],
        };

    private static Mock<ICollectionRunRepository> CreateRepository(bool imported)
    {
        Mock<ICollectionRunRepository> repository = new();
        repository
            .Setup(item => item.HasImportedHashAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<byte[]>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(imported);
        return repository;
    }

    private static Mock<IAzureExtractorIngestService> CreateImporter(Guid snapshotId)
    {
        Mock<IAzureExtractorIngestService> importer = new();
        importer
            .Setup(item => item.IngestZipBytesAsync(
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                null,
                It.IsAny<CancellationToken>(),
                null,
                It.IsAny<long>()))
            .ReturnsAsync(new AzureExtractorIngestResult { Succeeded = true, SnapshotId = snapshotId });
        return importer;
    }

    private static CollectionRunIngestService CreateService(
        Mock<ICollectionRunRepository> repository,
        Mock<IAzureExtractorIngestService> importer)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(item => item.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = TestTenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            });
        return new CollectionRunIngestService(repository.Object, importer.Object, scopeProvider.Object);
    }
}
