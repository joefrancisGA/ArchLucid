using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.CloudInventoryExtractor;

using static ArchLucid.Application.CloudInventoryExtractor.CloudInventoryExtractorUploadLimits;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class CloudInventoryExtractorUploadController
{
    private sealed record BeginChunkSessionResult(IActionResult? Failure, Guid SessionId);

    private async Task<BeginChunkSessionResult> TryBeginChunkSessionAsync(
        AzureExtractorChunkUploadStartBody body,
        CancellationToken cancellationToken)
    {
        if (!chunkedUpload.ChunkedPipelineAvailable)
        {
            return new BeginChunkSessionResult(
                StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new
                    {
                        detail =
                            "Chunked AWS/GCP inventory uploads require ArtifactLargePayload BlobProvider AzureBlob or Local with a writable staging path.",
                    }),
                Guid.Empty);
        }

        if (body is null || string.IsNullOrWhiteSpace(body.FileName))
        {
            return new BeginChunkSessionResult(
                this.BadRequestProblem("fileName is required.", ProblemTypes.ValidationFailed),
                Guid.Empty);
        }

        if (body.TotalChunks < 1)
        {
            return new BeginChunkSessionResult(
                this.BadRequestProblem("totalChunks must be at least 1.", ProblemTypes.ValidationFailed),
                Guid.Empty);
        }

        Guid sessionId =
            await chunkedUpload.BeginSessionAsync(body.FileName.Trim(), body.TotalChunks, body.TotalBytes, cancellationToken);

        return new BeginChunkSessionResult(null, sessionId);
    }

    private async Task<IActionResult> UploadChunkAsync(
        Guid sessionId,
        int chunkIndex,
        CancellationToken cancellationToken)
    {
        if (!chunkedUpload.ChunkedPipelineAvailable)

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    detail =
                        "Chunked AWS/GCP inventory uploads require ArtifactLargePayload BlobProvider AzureBlob or Local with a writable staging path.",
                });

        await chunkedUpload.UploadChunkAsync(sessionId, chunkIndex, Request.Body, cancellationToken);

        return NoContent();
    }

    private async Task<IActionResult> CompleteChunkUploadAsync(
        CloudProvider cloudProvider,
        Guid sessionId,
        Guid? runId,
        CancellationToken cancellationToken)
    {
        if (!chunkedUpload.ChunkedPipelineAvailable)

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    detail =
                        "Chunked AWS/GCP inventory uploads require ArtifactLargePayload BlobProvider AzureBlob or Local with a writable staging path.",
                });

        CloudInventoryExtractorIngestResult result =
            await chunkedUpload.CompleteSessionAsync(
                cloudProvider,
                sessionId,
                runId,
                cancellationToken,
                HttpContext.TraceIdentifier);

        if (result.Succeeded)

            return Accepted(new { packageId = result.PackageId });

        return MapIngestFailure(result);
    }
}
