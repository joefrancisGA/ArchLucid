using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Evidence;
using ArchLucid.Core.Authorization;
using ArchLucid.Api.Startup;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Evidence;
using ArchLucid.Host.Core.ProblemDetails;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
/// Handles bulk uploading of evidence files for architecture review runs.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture/run/{runId:guid}/evidence")]
[EnableRateLimiting("evidenceBulkUpload")]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class EvidenceBulkUploadController(
    IBulkEvidenceUploadService uploadService,
    IOptions<EvidenceBulkUploadOptions> bulkUploadOptions,
    IOptions<EvidenceBulkUploadAnomalyOptions> anomalyOptions,
    IEvidenceBulkUploadAnomalyTracker anomalyTracker,
    ILogger<EvidenceBulkUploadController> logger) : ControllerBase
{
    /// <summary>
    /// Bulk uploads evidence files for a given review run, up to <see cref="EvidenceBulkUploadOptions.EvidenceBulkUploadMaxFiles" />.
    /// </summary>
    [HttpPost("bulk")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100MB batch limit
    public async Task<IActionResult> UploadBulkEvidenceAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        // Bind files from the parsed form: [FromForm] IFormFileCollection can surface as empty for multi-part
        // multipart/integration clients even when parts are present (ReadFormAsync is authoritative).
        IFormCollection form = await Request.ReadFormAsync(cancellationToken);
        IFormFileCollection files = form.Files;

        string partitionKey = RateLimitingRolePartitionBuilder.ResolveClientPartitionKey(HttpContext);

        if (anomalyTracker.RecordAndEvaluate(partitionKey, files.Count))
        {
            int throttleMinutes = Math.Max(1, anomalyOptions.Value.ThrottleDurationMinutes);

            logger.LogWarning(
                "Evidence bulk upload anomaly detected for partition {EvidenceBulkUploadPartitionKey}; applying stricter rate limit for {EvidenceBulkUploadThrottleMinutes} minute(s).",
                partitionKey,
                throttleMinutes);
        }

        BulkEvidenceUploadResult result = await uploadService.UploadBulkEvidenceAsync(
            runId,
            files,
            cancellationToken,
            HttpContext.TraceIdentifier);

        if (result.Succeeded)
        {
            return Ok(new { evidenceItemIds = result.UploadedEvidenceItemIds });
        }

        if (result.ErrorCode == ProblemErrorCodes.RunNotFound)
        {
            return this.NotFoundProblem(result.FailureDetail ?? "Run not found.");
        }

        if (result.ErrorCode == ProblemErrorCodes.EvidenceBulkUploadLimitExceeded)
        {
            return this.EvidenceBulkUploadLimitProblem(bulkUploadOptions.Value.EvidenceBulkUploadMaxFiles, files.Count);
        }

        if (result.ErrorCode == ProblemErrorCodes.ValidationFailed)
        {
            return this.BadRequestProblem(result.FailureDetail ?? "Validation failed.", ProblemTypes.ValidationFailed);
        }

        return this.BadRequestProblem(result.FailureDetail ?? "Upload failed.");
    }
}
