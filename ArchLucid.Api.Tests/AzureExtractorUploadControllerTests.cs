using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.AzureExtractorChunkUpload;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Fast-path unit tests for <see cref="AzureExtractorUploadController" /> ingest failure mapping
///     (no SQL host or multipart I/O).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorUploadControllerTests
{
    [Fact]
    public async Task UploadAsync_schema_rejection_returns_400_validation_problem()
    {
        Mock<IAzureExtractorIngestService> ingest = new();
        ingest.Setup(s => s.IngestZipAsync(
                It.IsAny<IFormFile?>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>()))
            .ReturnsAsync(new AzureExtractorIngestResult
            {
                Succeeded = false,
                IsSchemaRejection = true,
                FailureDetail = "Unsupported manifest schemaVersion: 99.",
            });

        AzureExtractorUploadController sut = CreateController(ingest.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.UploadAsync(file: null, runId: null, CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task UploadAsync_invalid_archive_returns_400_validation_problem()
    {
        Mock<IAzureExtractorIngestService> ingest = new();
        ingest.Setup(s => s.IngestZipAsync(
                It.IsAny<IFormFile?>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>()))
            .ReturnsAsync(new AzureExtractorIngestResult
            {
                Succeeded = false,
                IsInvalidArchive = true,
                IsSchemaRejection = false,
                FailureDetail = "Uploaded payload is not a valid ZIP archive.",
            });

        AzureExtractorUploadController sut = CreateController(ingest.Object);
        sut.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        IActionResult result = await sut.UploadAsync(file: null, runId: null, CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    private static AzureExtractorUploadController CreateController(IAzureExtractorIngestService ingestService)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid() });

        Mock<IAzureExtractorChunkSessionStore> chunkStore = new();
        chunkStore.Setup(c => c.IsAvailable).Returns(false);

        AzureExtractorChunkedUploadService chunkedUpload = new(
            scope.Object,
            chunkStore.Object,
            ingestService,
            Options.Create(new AzureExtractorChunkUploadOptions()),
            NullLogger<AzureExtractorChunkedUploadService>.Instance);

        return new AzureExtractorUploadController(
            ingestService,
            chunkedUpload,
            Mock.Of<IAzureExtractorPackageRepository>(),
            Mock.Of<IActorContext>(),
            scope.Object,
            Mock.Of<IAuditService>(),
            NullLogger<AzureExtractorUploadController>.Instance);
    }
}
