using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.CloudInventoryExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using static ArchLucid.Application.CloudInventoryExtractor.CloudInventoryExtractorUploadLimits;

using ArchLucid.Application.AzureExtractor;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Multipart ingest of customer-run AWS/GCP inventory ZIP packages (schema-validated).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/extractor")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class CloudInventoryExtractorUploadController(
    ICloudInventoryExtractorIngestService ingestService,
    CloudInventoryExtractorChunkedUploadService chunkedUpload,
    ICloudInventoryExtractorPackageRepository packageRepository,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    ILogger<CloudInventoryExtractorUploadController> logger) : ControllerBase
{
    /// <summary>Upload AWS inventory output (<c>.zip</c>).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("aws/upload")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [RequestSizeLimit(MultipartEnvelopeBudgetBytes)]
    public Task<IActionResult> UploadAwsAsync(IFormFile? file, [FromQuery] Guid? runId, CancellationToken cancellationToken)
        => UploadAsync(CloudProvider.Aws, file, runId, cancellationToken);

    /// <summary>Upload GCP inventory output (<c>.zip</c>).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("gcp/upload")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [RequestSizeLimit(MultipartEnvelopeBudgetBytes)]
    public Task<IActionResult> UploadGcpAsync(IFormFile? file, [FromQuery] Guid? runId, CancellationToken cancellationToken)
        => UploadAsync(CloudProvider.Gcp, file, runId, cancellationToken);

    /// <summary>Downloads a persisted AWS inventory ZIP package for the current workspace scope.</summary>
    [HttpGet("aws/packages/{packageId:guid}")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> DownloadAwsPackageAsync(Guid packageId, CancellationToken cancellationToken)
        => DownloadPackageAsync(CloudProvider.Aws, packageId, cancellationToken);

    /// <summary>Downloads a persisted GCP inventory ZIP package for the current workspace scope.</summary>
    [HttpGet("gcp/packages/{packageId:guid}")]
    [Produces("application/zip")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<IActionResult> DownloadGcpPackageAsync(Guid packageId, CancellationToken cancellationToken)
        => DownloadPackageAsync(CloudProvider.Gcp, packageId, cancellationToken);

    /// <summary>Starts a chunked AWS inventory ingest session.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("aws/upload-sessions")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> BeginAwsChunkUploadAsync(
        [FromBody] AzureExtractorChunkUploadStartBody body,
        CancellationToken cancellationToken)
    {
        BeginChunkSessionResult beginResult =
            await TryBeginChunkSessionAsync(body, cancellationToken);

        if (beginResult.Failure is not null)
        {
            return beginResult.Failure;
        }

        string auditActor = actorContext.GetActor();
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.CloudInventoryExtractorPackageChunkSessionStarted,
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        cloudProvider = CloudProvider.Aws.ToString(),
                        sessionId = beginResult.SessionId,
                        fileName = body!.FileName.Trim(),
                        body.TotalChunks,
                        totalBytes = body.TotalBytes,
                        maxChunkBytes = chunkedUpload.MaxConfiguredChunkUploadBytes,
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        return Ok(new { sessionId = beginResult.SessionId, maxChunkBytes = chunkedUpload.MaxConfiguredChunkUploadBytes });
    }

    /// <summary>Starts a chunked GCP inventory ingest session.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("gcp/upload-sessions")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> BeginGcpChunkUploadAsync(
        [FromBody] AzureExtractorChunkUploadStartBody body,
        CancellationToken cancellationToken)
    {
        BeginChunkSessionResult beginResult =
            await TryBeginChunkSessionAsync(body, cancellationToken);

        if (beginResult.Failure is not null)
        {
            return beginResult.Failure;
        }

        string auditActor = actorContext.GetActor();
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.CloudInventoryExtractorPackageChunkSessionStarted,
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        cloudProvider = CloudProvider.Gcp.ToString(),
                        sessionId = beginResult.SessionId,
                        fileName = body!.FileName.Trim(),
                        body.TotalChunks,
                        totalBytes = body.TotalBytes,
                        maxChunkBytes = chunkedUpload.MaxConfiguredChunkUploadBytes,
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        return Ok(new { sessionId = beginResult.SessionId, maxChunkBytes = chunkedUpload.MaxConfiguredChunkUploadBytes });
    }

    /// <summary>Uploads one zero-based chunk of an AWS inventory ZIP.</summary>
    [HttpPut("aws/upload-sessions/{sessionId:guid}/chunks/{chunkIndex:int}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("application/octet-stream")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    [RequestSizeLimit(ChunkUploadHttpEnvelopeBudgetBytes)]
    public Task<IActionResult> UploadAwsChunkAsync(
        Guid sessionId,
        int chunkIndex,
        CancellationToken cancellationToken)
        => UploadChunkAsync(sessionId, chunkIndex, cancellationToken);

    /// <summary>Uploads one zero-based chunk of a GCP inventory ZIP.</summary>
    [HttpPut("gcp/upload-sessions/{sessionId:guid}/chunks/{chunkIndex:int}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("application/octet-stream")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    [RequestSizeLimit(ChunkUploadHttpEnvelopeBudgetBytes)]
    public Task<IActionResult> UploadGcpChunkAsync(
        Guid sessionId,
        int chunkIndex,
        CancellationToken cancellationToken)
        => UploadChunkAsync(sessionId, chunkIndex, cancellationToken);

    /// <summary>Assembles staged AWS inventory chunks and runs ingest.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("aws/upload-sessions/{sessionId:guid}/complete")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public Task<IActionResult> CompleteAwsChunkUploadAsync(
        Guid sessionId,
        [FromQuery] Guid? runId,
        CancellationToken cancellationToken)
        => CompleteChunkUploadAsync(CloudProvider.Aws, sessionId, runId, cancellationToken);

    /// <summary>Assembles staged GCP inventory chunks and runs ingest.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("gcp/upload-sessions/{sessionId:guid}/complete")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public Task<IActionResult> CompleteGcpChunkUploadAsync(
        Guid sessionId,
        [FromQuery] Guid? runId,
        CancellationToken cancellationToken)
        => CompleteChunkUploadAsync(CloudProvider.Gcp, sessionId, runId, cancellationToken);

    private async Task<IActionResult> UploadAsync(
        CloudProvider cloudProvider,
        IFormFile? file,
        Guid? runId,
        CancellationToken cancellationToken)
    {
        CloudInventoryExtractorIngestResult result =
            await ingestService.IngestZipAsync(cloudProvider, file, runId, cancellationToken, HttpContext.TraceIdentifier);

        if (result.Succeeded)
            return Accepted(new { packageId = result.PackageId });

        return MapIngestFailure(result);
    }

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

    private async Task<IActionResult> DownloadPackageAsync(
        CloudProvider cloudProvider,
        Guid packageId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        CloudInventoryExtractorPackageDownloadRecord? package =
            await packageRepository.TryGetDownloadByPackageIdAsync(scope, cloudProvider, packageId, cancellationToken);

        if (package is null)
        {
            return this.NotFoundProblem(
                $"{cloudProvider} inventory package '{packageId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound);
        }

        string auditActor = actorContext.GetActor();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.CloudInventoryExtractorPackageDownloaded,
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = package.RunId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        cloudProvider = cloudProvider.ToString(),
                        packageId = package.PackageId,
                        runId = package.RunId,
                        originalFileName = package.OriginalFileName,
                        sizeBytes = package.PackageBytes.LongLength,
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        string defaultName = cloudProvider == CloudProvider.Aws
            ? "aws-inventory-package.zip"
            : "gcp-inventory-package.zip";

        string fileName = string.IsNullOrWhiteSpace(package.OriginalFileName)
            ? defaultName
            : package.OriginalFileName.Trim();

        return File(package.PackageBytes, "application/zip", fileName);
    }

    private IActionResult MapIngestFailure(CloudInventoryExtractorIngestResult result)
    {
        string detail = result.FailureDetail ?? "Ingest failed.";

        if (logger.IsEnabled(LogLevel.Information))
            logger.LogInformation("Cloud inventory extractor ingest rejected: {Detail}", detail);

        if (result.IsInvalidArchive || result.IsSchemaRejection)
        {
            string failureKind = result.IsSchemaRejection ? "schema" : "archive";
            Dictionary<string, object?> extensions = new()
            {
                ["failureKind"] = failureKind,
                ["errors"] = new[] { detail },
            };

            if (result.IsSchemaRejection)
            {
                extensions["requiredSchemaVersion"] =
                    CloudInventoryExtractorPackageZipValidator.SupportedSchemaVersion;
            }

            return this.BadRequestProblem(
                detail,
                ProblemTypes.ValidationFailed,
                extensions: extensions);
        }

        return this.UnprocessableEntityProblem(
            detail,
            extensions: new Dictionary<string, object?>
            {
                ["failureKind"] = "validation",
                ["errors"] = new[] { detail },
            });
    }
}
