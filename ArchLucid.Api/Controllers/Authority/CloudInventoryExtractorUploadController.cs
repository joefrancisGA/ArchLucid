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
