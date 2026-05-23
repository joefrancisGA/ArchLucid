using System.IO.Compression;
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
        result.IsInvalidArchive.Should().BeTrue();
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

        byte[] zipBytes = BuildExtractorZipBytes(manifestJson, "[]");

        var sut = CreateService(out var packageRepo, out _);

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

        packageRepo.Verify(
            p => p.InsertAsync(It.IsAny<AzureExtractorPackageRecord>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task IngestZipBytesAsync_when_manifest_json_malformed_rejects_before_package_insert()
    {
        byte[] zipBytes = BuildExtractorZipBytes("{ not-valid-json", "[]");

        var sut = CreateService(out var packageRepo, out _);

        var result = await sut.IngestZipBytesAsync(
            zipBytes,
            "bad-manifest.zip",
            Guid.NewGuid(),
            CancellationToken.None,
            "corr1",
            AzureExtractorUploadLimits.MaxZipBytes);

        result.Succeeded.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.FailureDetail.Should().Contain("valid JSON");

        packageRepo.Verify(
            p => p.InsertAsync(It.IsAny<AzureExtractorPackageRecord>(), It.IsAny<CancellationToken>()),
            Times.Never);
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

        byte[] zipBytes = BuildExtractorZipBytes(manifestJson, "[]");

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

    private static byte[] BuildExtractorZipBytes(string manifestJson, string resourcesJson)
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry manifest = zip.CreateEntry("manifest.json");

            using (StreamWriter writer = new(manifest.Open()))
            {
                writer.Write(manifestJson);
            }

            ZipArchiveEntry resources = zip.CreateEntry("resources.json");

            using (StreamWriter writer = new(resources.Open()))
            {
                writer.Write(resourcesJson);
            }
        }

        return ms.ToArray();
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
