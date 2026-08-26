using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.CloudInventoryExtractor;

using static ArchLucid.Application.CloudInventoryExtractor.CloudInventoryExtractorUploadLimits;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class CloudInventoryExtractorUploadController
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
