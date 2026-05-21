using System.Text.Json;

using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorIngestServiceTests
{
    [Fact]
    public async Task IngestZipAsync_when_file_is_null_returns_failure()
    {
        var sut = CreateService(out _, out _);

        var result = await sut.IngestZipAsync(null, Guid.NewGuid(), CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureDetail.Should().Contain("No file uploaded");
    }

    [Fact]
    public async Task IngestZipAsync_when_file_too_large_returns_failure()
    {
        var sut = CreateService(out _, out _);
        Mock<IFormFile> file = new();
        file.Setup(f => f.Length).Returns(AzureExtractorUploadLimits.MaxZipBytes + 1);
        file.Setup(f => f.FileName).Returns("test.zip");

        var result = await sut.IngestZipAsync(file.Object, Guid.NewGuid(), CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureDetail.Should().Contain("exceeds maximum size");
    }

    [Fact]
    public async Task IngestZipBytesAsync_when_zip_invalid_returns_failure()
    {
        var sut = CreateService(out _, out _);

        byte[] badBytes = "not-a-zip"u8.ToArray();

        var result = await sut.IngestZipBytesAsync(
            badBytes,
            "bad.zip",
            Guid.NewGuid(),
            CancellationToken.None,
            "corr1",
            AzureExtractorUploadLimits.MaxZipBytes);

        result.Succeeded.Should().BeFalse();

        result.FailureDetail.Should().Contain("Uploaded payload is not a valid ZIP archive.");
    }

    [Fact]
    public async Task IngestZipBytesAsync_when_schema_unsupported_returns_schema_rejection()
    {
        // Mock a zip stream that returns an unsupported schema version
        var manifest = new
        {
            schemaVersion = 99
        };
        var manifestJson = JsonSerializer.Serialize(manifest);

        using var ms = new MemoryStream();
        await using (var archive = new System.IO.Compression.ZipArchive(ms, System.IO.Compression.ZipArchiveMode.Create, true))
        {
            var entry = archive.CreateEntry("manifest.json");
            await using var entryStream = await entry.OpenAsync();
            await using var writer = new StreamWriter(entryStream);
            await writer.WriteAsync(manifestJson);
        }

        var zipBytes = ms.ToArray();

        var sut = CreateService(out _, out _);

        var result = await sut.IngestZipBytesAsync(
            zipBytes,
            "test.zip",
            Guid.NewGuid(),
            CancellationToken.None,
            "corr1",
            AzureExtractorUploadLimits.MaxZipBytes);

        result.Succeeded.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.FailureDetail.Should().Contain("Unsupported manifest schemaVersion");
    }

    [Fact]
    public async Task IngestZipBytesAsync_when_valid_returns_success_and_saves_package()
    {
        var runId = Guid.NewGuid();
        var manifest = new
        {
            schemaVersion = 1,
            scriptVersion = "1.0.0",
            collectionTimestamp = DateTime.UtcNow.ToString("O"),
            subscriptionId = Guid.NewGuid().ToString(),
        };
        var manifestJson = JsonSerializer.Serialize(manifest);

        using var ms = new MemoryStream();
        await using (var archive = new System.IO.Compression.ZipArchive(ms, System.IO.Compression.ZipArchiveMode.Create, true))
        {
            var entry = archive.CreateEntry("manifest.json");
            await using var entryStream = await entry.OpenAsync();
            await using var writer = new StreamWriter(entryStream);
            await writer.WriteAsync(manifestJson);
        }

        var zipBytes = ms.ToArray();

        var sut = CreateService(out var packageRepo, out var runRepo);

        runRepo.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runId });

        var result = await sut.IngestZipBytesAsync(
            zipBytes,
            "valid.zip",
            runId,
            CancellationToken.None,
            "corr1",
            AzureExtractorUploadLimits.MaxZipBytes);

        result.Succeeded.Should().BeTrue();
        result.IsSchemaRejection.Should().BeFalse();
        result.PackageId.Should().NotBeEmpty();

        packageRepo.Verify(p => p.InsertAsync(It.Is<AzureExtractorPackageRecord>(r => r.OriginalFileName == "valid.zip" && r.SchemaVersion == 1 && r.PackageId == result.PackageId), It.IsAny<CancellationToken>()), Times.Once);
    }

    private static AzureExtractorIngestService CreateService(
        out Mock<IAzureExtractorPackageRepository> packageRepo,
        out Mock<IRunRepository> runRepo)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid() });

        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns("test-user");

        Mock<IAuditService> auditService = new();
        packageRepo = new();
        runRepo = new();
        Mock<IAgentTaskRepository> tasks = new();
        Mock<IEvidenceBundleRepository> evidence = new();

        return new AzureExtractorIngestService(
            scope.Object,
            actor.Object,
            auditService.Object,
            packageRepo.Object,
            runRepo.Object,
            tasks.Object,
            evidence.Object,
            NullLogger<AzureExtractorIngestService>.Instance);
    }
}
