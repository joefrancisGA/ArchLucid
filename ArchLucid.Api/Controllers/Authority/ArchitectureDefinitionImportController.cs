using ArchLucid.Application.Import;
using ArchLucid.Core.Authorization;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Manifest;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Dry-run import of external architecture definitions (CSV) into a <see cref="GoldenManifest" /> shape.
/// </summary>
/// <remarks>
///     Requires <see cref="ArchLucidPolicies.ArchitectureDefinitionImport" /> (Entra roles Operator, Architect, WorkspaceAdmin, or Admin).
///     Multipart body size is capped at <see cref="ArchitectureDefinitionCsvImportDryRunService.MaxUploadBytes" />.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class ArchitectureDefinitionImportController(
    IArchitectureDefinitionCsvImportDryRunService csvImportDryRunService,
    ILogger<ArchitectureDefinitionImportController> logger) : ControllerBase
{
    /// <summary>
    ///     Accepts a CSV with columns <c>ComponentName</c>, <c>Type</c>, and <c>Description</c>; returns a mapped golden manifest JSON without persisting.
    /// </summary>
    /// <remarks>
    ///     Do not decorate <see cref="IFormFile" /> with <c>[FromForm]</c> (Swashbuckle OpenAPI generation limitation); bind
    ///     <c>systemName</c> via <c>[FromForm]</c> only.
    /// </remarks>
    [HttpPost("import")]
    [Authorize(Policy = ArchLucidPolicies.ArchitectureDefinitionImport)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(GoldenManifest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    [RequestSizeLimit(ArchitectureDefinitionCsvImportDryRunService.MaxUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ArchitectureDefinitionCsvImportDryRunService.MaxUploadBytes)]
    public async Task<IActionResult> ImportDryRunAsync([FromForm] string? systemName, IFormFile? file,
        CancellationToken cancellationToken)
    {
        ArchitectureDefinitionCsvImportDryRunResult result =
            await csvImportDryRunService.ImportDryRunAsync(file, systemName, cancellationToken);

        if (result is { Succeeded: true, Manifest: { } manifest })
            return Ok(manifest);

        string detail = result.FailureDetail ?? "Import failed.";
        logger.LogInformation("Architecture CSV import dry-run rejected: {Detail}", detail);

        return this.UnprocessableEntityProblem(detail);
    }
}
