using ArchLucid.Api.Attributes;
using ArchLucid.Application.Reports;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Reports;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/reports/executive-summary")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class ExecutiveSummaryController : ControllerBase
{
    private readonly IScopeContextProvider _scopeContextProvider;

    public ExecutiveSummaryController(IScopeContextProvider scopeContextProvider)
    {
        _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    }

    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(typeof(ExecutiveSummaryResult), StatusCodes.Status200OK)]
    public ActionResult<ExecutiveSummaryResult> GetExecutiveSummary()
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        // Mock data retrieval for the tenant's findings across runs
        var mockFindings = new List<ExecutiveSummaryFinding>
        {
            new("finding-1", "run-1", 100m, 5),
            new("finding-1", "run-2", 100m, 5),
            new("finding-2", "run-1", 200m, 10),
            new("finding-3", "run-2", 150m, 2)
        };

        ExecutiveSummaryResult result = ExecutiveSummaryAggregator.Aggregate(mockFindings);

        return Ok(result);
    }
}
