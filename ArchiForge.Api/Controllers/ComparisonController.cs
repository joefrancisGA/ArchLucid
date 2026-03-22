using ArchiForge.Api.Auth.Models;
using ArchiForge.Core.Comparison;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Comparison;
using ArchiForge.Persistence.Queries;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/compare")]
[EnableRateLimiting("fixed")]
public sealed class ComparisonController(
    IAuthorityQueryService query,
    IComparisonService comparison,
    IScopeContextProvider scopeProvider)
    : ControllerBase
{
    /// <summary>Structured GoldenManifest delta between two runs (base → target).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ComparisonResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompareRuns(
        [FromQuery] Guid baseRunId,
        [FromQuery] Guid targetRunId,
        CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();
        var baseRun = await query.GetRunDetailAsync(scope, baseRunId, ct);
        var targetRun = await query.GetRunDetailAsync(scope, targetRunId, ct);

        if (baseRun?.GoldenManifest is null || targetRun?.GoldenManifest is null)
            return NotFound();

        var result = comparison.Compare(baseRun.GoldenManifest, targetRun.GoldenManifest);
        return Ok(result);
    }
}
