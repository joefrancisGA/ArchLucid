using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Lightweight architecture quick scan (single LLM pass; no run lifecycle).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class ArchitectureQuickScanController(IQuickScanService quickScanService) : ControllerBase
{
    /// <summary>Runs a quick scan from minimal context (simulator-friendly by default).</summary>
    [HttpPost("quick-scan")]
    [ProducesResponseType(typeof(ArchitectureQuickScanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PostQuickScanAsync(
        [FromBody] ArchitectureQuickScanRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        string systemName = (request.SystemName).Trim();
        string cloud = (request.CloudProvider).Trim();
        string description = (request.Description).Trim();


        if (string.IsNullOrWhiteSpace(systemName))
            return this.BadRequestProblem("systemName is required.", ProblemTypes.ValidationFailed);


        if (string.IsNullOrWhiteSpace(cloud))
            return this.BadRequestProblem("cloudProvider is required.", ProblemTypes.ValidationFailed);


        if (string.IsNullOrWhiteSpace(description))
            return this.BadRequestProblem("description is required.", ProblemTypes.ValidationFailed);

        ArchitectureQuickScanRequest normalized = new()
        {
            SystemName = systemName,
            CloudProvider = cloud,
            Description = description
        };

        Dictionary<string, string> files = QuickScanMinimalContextBuilder.BuildFiles(normalized);
        QuickScanResult scan = await quickScanService.ScanAsync(files, cancellationToken).ConfigureAwait(false);
        ArchitectureQuickScanResponse body = ArchitectureQuickScanResponseMapper.Map(scan);

        return Ok(body);
    }
}
