using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Exports;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Markdown executive summaries and related run export variants.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class ArchitectureExportController(IRunSummaryOnePagerExportService exportService) : ControllerBase
{
    /// <summary>Downloads an AI-assisted executive one-pager for a committed run.</summary>
    [HttpGet("run/{runId}/export/summary")]
    [Produces("text/markdown")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ExportRunSummary(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return this.BadRequestProblem("runId is required.", ProblemTypes.ValidationFailed);

        try
        {
            RunSummaryOnePagerExportResult result = await exportService.GenerateMarkdownAsync(runId.Trim(), cancellationToken);
            return File(result.Content, result.ContentType, result.FileName);
        }
        catch (RunNotFoundException)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }
        catch (ConflictException conflict)
        {
            return this.ConflictProblem(conflict.Message, ProblemTypes.Conflict);
        }
    }
}
