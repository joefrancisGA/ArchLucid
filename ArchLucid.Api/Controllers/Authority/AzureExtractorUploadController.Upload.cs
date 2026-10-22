using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.Authorization;

using static ArchLucid.Application.AzureExtractor.AzureExtractorUploadLimits;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AzureExtractorUploadController
{
    /// <summary>
    ///     Upload Azure extractor output (<c>.zip</c>). Returns <strong>202</strong> with <c>packageId</c> when stored;
    ///     <strong>400</strong> when the archive is corrupt or manifest schema is missing, malformed, or unsupported.
    /// </summary>
    /// <remarks>
    ///     Optional query <c>runId</c> associates the package with an architecture review run in the current workspace
    ///     scope. Do not decorate <see cref="IFormFile" /> with <c>[FromForm]</c> (Swashbuckle OpenAPI constraint).
    /// </remarks>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("upload")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [RequestSizeLimit(MultipartEnvelopeBudgetBytes)]
    public async Task<IActionResult> UploadAsync(
        IFormFile? file,
        [FromQuery] Guid? runId,
        CancellationToken cancellationToken)
    {
        AzureExtractorIngestResult result =
            await ingestService.IngestZipAsync(file, runId, cancellationToken, HttpContext.TraceIdentifier);

        if (result.Succeeded)

            return Accepted(new { packageId = result.PackageId });

        return MapIngestFailure(result);
    }
}
