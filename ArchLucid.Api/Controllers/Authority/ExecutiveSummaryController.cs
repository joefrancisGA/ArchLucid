using ArchLucid.Application.ExecutiveSummary;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     HTTP API for retrieving high-level executive summaries of architectural health.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/authority/executive-summary")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class ExecutiveSummaryController(
    IExecutiveSummaryService executiveSummaryService,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    /// <summary>
    ///     Aggregates raw architectural findings into three high-level scores: Security Posture, Tech Debt Risk, and Compliance Alignment.
    /// </summary>
    [HttpGet("{tenantId:guid}")]
    [ProducesResponseType(typeof(ExecutiveSummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExecutiveSummary(
        [FromRoute] Guid tenantId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        ExecutiveSummaryResponse response =
            await executiveSummaryService.GenerateSummaryAsync(scope.TenantId, cancellationToken);

        return Ok(response);
    }
}
