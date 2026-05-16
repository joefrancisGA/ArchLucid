using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Evidence;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.ProblemDetails;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
/// Handles bulk uploading of evidence files for architecture review runs.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture/run/{runId:guid}/evidence")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class EvidenceBulkUploadController(
    IBulkEvidenceUploadService uploadService,
    IOptions<EvidenceBulkUploadOptions> bulkUploadOptions) : ControllerBase
{
    /// <summary>
    /// Bulk uploads evidence files for a given review run, up to <see cref="EvidenceBulkUploadOptions.EvidenceBulkUploadMaxFiles" />.
    /// </summary>
    [HttpPost("bulk")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100MB batch limit
    public async Task<IActionResult> UploadBulkEvidenceAsync(
        Guid runId,
        IFormFileCollection files,
        CancellationToken cancellationToken)
    {
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
