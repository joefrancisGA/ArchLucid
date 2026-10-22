using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using static ArchLucid.Application.AzureExtractor.AzureExtractorUploadLimits;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AzureExtractorUploadController
{
    /// <summary>
    ///     Starts a chunked extractor ingest session (requires ArtifactLargePayload BlobProvider AzureBlob or Local).
    ///     Upload raw ZIP fragments with <see cref="UploadChunkAsync" />, then call <see cref="CompleteChunkUploadAsync" />.
    /// </summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("upload-sessions")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> BeginChunkUploadAsync(
        [FromBody] AzureExtractorChunkUploadStartBody body,
        CancellationToken cancellationToken)
    {
        if (!chunkedUpload.ChunkedPipelineAvailable)

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    detail =
                        "Chunked Azure extractor uploads require ArtifactLargePayload BlobProvider AzureBlob or Local with a writable staging path."
                });

        if (body is null || string.IsNullOrWhiteSpace(body.FileName))

            return this.BadRequestProblem("fileName is required.", ProblemTypes.ValidationFailed);

        if (body.TotalChunks < 1)

            return this.BadRequestProblem("totalChunks must be at least 1.", ProblemTypes.ValidationFailed);

        Guid sessionId =
            await chunkedUpload.BeginSessionAsync(body.FileName.Trim(), body.TotalChunks, body.TotalBytes, cancellationToken);

        string auditActor = actorContext.GetActor();
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AzureExtractorPackageChunkSessionStarted,
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        sessionId,
                        fileName = body.FileName.Trim(),
                        body.TotalChunks,
                        totalBytes = body.TotalBytes,
                        maxChunkBytes = chunkedUpload.MaxConfiguredChunkUploadBytes
                    },
                    AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);

        return Ok(new { sessionId, maxChunkBytes = chunkedUpload.MaxConfiguredChunkUploadBytes });
    }

    /// <summary>Uploads one zero-based chunk of the extractor ZIP as raw octet-stream.</summary>
    [HttpPut("upload-sessions/{sessionId:guid}/chunks/{chunkIndex:int}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("application/octet-stream")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    [RequestSizeLimit(ChunkUploadHttpEnvelopeBudgetBytes)]
    public async Task<IActionResult> UploadChunkAsync(
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
                        "Chunked Azure extractor uploads require ArtifactLargePayload BlobProvider AzureBlob or Local with a writable staging path."
                });

        await chunkedUpload.UploadChunkAsync(sessionId, chunkIndex, Request.Body, cancellationToken);

        return NoContent();
    }

    /// <summary>Assembles staged chunks and runs the same ingest pipeline as <see cref="UploadAsync" />.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("upload-sessions/{sessionId:guid}/complete")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> CompleteChunkUploadAsync(
        Guid sessionId,
        [FromQuery] Guid? runId,
        CancellationToken cancellationToken)
    {
        if (!chunkedUpload.ChunkedPipelineAvailable)

            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    detail =
                        "Chunked Azure extractor uploads require ArtifactLargePayload BlobProvider AzureBlob or Local with a writable staging path."
                });

        AzureExtractorIngestResult result =
            await chunkedUpload.CompleteSessionAsync(sessionId, runId, cancellationToken, HttpContext.TraceIdentifier);

        if (result.Succeeded)

            return Accepted(new { packageId = result.PackageId });

        return MapIngestFailure(result);
    }
}
