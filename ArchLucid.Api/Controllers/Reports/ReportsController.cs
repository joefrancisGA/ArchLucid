using ArchLucid.Application.Reports;
using ArchLucid.Contracts.Reports;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Reports;

/// <summary>Operator reports derived from ingested architecture and extractor payloads.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/reports")]
[EnableRateLimiting("fixed")]
public sealed class ReportsController(ResourceCoverageReportService resourceCoverageReportService) : ControllerBase
{
    private readonly ResourceCoverageReportService _resourceCoverageReportService =
        resourceCoverageReportService ?? throw new ArgumentNullException(nameof(resourceCoverageReportService));

    /// <summary>Counts Azure resource types from the latest scoped extractor ZIP.</summary>
    [HttpGet("resource-coverage")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(ResourceCoverageReportResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ResourceCoverageReportResponse>> GetResourceCoverageAsync(CancellationToken cancellationToken)
    {
        ResourceCoverageReportResponse body = await _resourceCoverageReportService.BuildAsync(cancellationToken).ConfigureAwait(false);
        return Ok(body);
    }
}
