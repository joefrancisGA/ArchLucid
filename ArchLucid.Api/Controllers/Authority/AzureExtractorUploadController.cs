using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.Authorization;

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
    ILogger<AzureExtractorUploadController> logger) : ControllerBase
{
    private static readonly long MaxBodyBytes = AzureExtractorIngestService.MaxUploadedZipBytes + 256 * 1024;

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
    [RequestSizeLimit(MaxBodyBytes)]
    public async Task<IActionResult> UploadAsync(
        IFormFile? file,
        [FromQuery] Guid? runId,
        CancellationToken cancellationToken)
    {
        AzureExtractorIngestResult result =
            await ingestService.IngestZipAsync(file, runId, cancellationToken, HttpContext.TraceIdentifier);

        if (result.Succeeded)

            return Accepted(new { packageId = result.PackageId });

        string detail = result.FailureDetail ?? "Ingest failed.";

        if (logger.IsEnabled(LogLevel.Information))

            logger.LogInformation("Azure extractor ingest rejected: {Detail}", detail);

        return this.UnprocessableEntityProblem(detail);

    }

}
