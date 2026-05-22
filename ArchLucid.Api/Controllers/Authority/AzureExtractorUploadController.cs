using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using static ArchLucid.Application.AzureExtractor.AzureExtractorUploadLimits;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Multipart ingest of customer-run Azure extractor ZIP packages (schema-validated).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/azure-extractor")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class AzureExtractorUploadController(
    IAzureExtractorIngestService ingestService,
    AzureExtractorChunkedUploadService chunkedUpload,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    ILogger<AzureExtractorUploadController> logger) : ControllerBase
{

    /// <summary>
    ///     Upload Azure extractor output (<c>.zip</c>). Returns <strong>202</strong> with <c>packageId</c> when stored;
    ///     <strong>422</strong> when manifest is missing, invalid, or schema is unsupported.
    /// </summary>
    /// <remarks>
    ///     Optional query <c>runId</c> associates the package with an architecture review run in the current workspace
    ///     scope. Do not decorate <see cref="IFormFile" /> with <c>[FromForm]</c> (Swashbuckle OpenAPI constraint).
    /// </remarks>
    [HttpPost("upload")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [RequestSizeLimit(MultipartEnvelopeBudgetBytes)]
    public async Task<IActionResult> UploadAsync(
        IFormFile? file,
        [FromQuery] Guid? runId,
        CancellationToken cancellationToken)
    {
        if (file != null)
        {
            try
            {
                using var stream = file.OpenReadStream();
                using System.IO.Compression.ZipArchive archive = new(stream, System.IO.Compression.ZipArchiveMode.Read, leaveOpen: true);
                System.IO.Compression.ZipArchiveEntry? manifestEntry = archive.GetEntry("manifest.json");
                if (manifestEntry == null)
                {
                    return this.BadRequestProblem("Missing manifest.json", ProblemTypes.ValidationFailed);
                }
                
                using var manifestStream = manifestEntry.Open();
                using var doc = JsonDocument.Parse(manifestStream);
                if (!doc.RootElement.TryGetProperty("schemaVersion", out JsonElement schemaVersionElement) || 
                    schemaVersionElement.GetInt32() != 1)
                {
                    return this.BadRequestProblem("Missing or unsupported schemaVersion in manifest.json", ProblemTypes.ValidationFailed);
                }
            }
            catch (Exception ex) when (ex is not InvalidOperationException)
            {
                // Fall back to existing pipeline if ZIP parsing fails here
            }
        }

        AzureExtractorIngestResult result =
            await ingestService.IngestZipAsync(file, runId, cancellationToken, HttpContext.TraceIdentifier);

        if (result.Succeeded)

            return Accepted(new { packageId = result.PackageId });

        string detail = result.FailureDetail ?? "Ingest failed.";

        if (logger.IsEnabled(LogLevel.Information))

            logger.LogInformation("Azure extractor ingest rejected: {Detail}", detail);

        return this.UnprocessableEntityProblem(detail);

    }

    /// <summary>
    ///     Starts a chunked extractor ingest session (requires ArtifactLargePayload BlobProvider AzureBlob or Local).
    ///     Upload raw ZIP fragments with <see cref="UploadChunkAsync" />, then call <see cref="CompleteChunkUploadAsync" />.
    /// </summary>
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

        string detail = result.FailureDetail ?? "Ingest failed.";

        if (logger.IsEnabled(LogLevel.Information))

            logger.LogInformation("Azure extractor chunked ingest rejected: {Detail}", detail);

        return this.UnprocessableEntityProblem(detail);

    }

}
