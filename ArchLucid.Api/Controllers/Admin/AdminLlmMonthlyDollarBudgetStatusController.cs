using ArchLucid.Application.Budgeting;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Execute-authority read-model for UTC-month LLM dollar hard caps (tenant-scoped).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin")]
public sealed class AdminLlmMonthlyDollarBudgetStatusController(
    ILlmMonthlyTenantDollarBudgetStatusService statusService) : ControllerBase
{
    private readonly ILlmMonthlyTenantDollarBudgetStatusService _statusService =
        statusService ?? throw new ArgumentNullException(nameof(statusService));

    /// <summary>
    ///     Returns whether configured monthly dollar limits would block further LLM completions for this tenant (UTC
    ///     month row).
    /// </summary>
    [HttpGet("llm-monthly-dollar-budget-status")]
    [ProducesResponseType(typeof(LlmMonthlyTenantDollarBudgetStatusResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<LlmMonthlyTenantDollarBudgetStatusResult>> GetStatus(
        CancellationToken cancellationToken = default)
    {
        LlmMonthlyTenantDollarBudgetStatusResult result = await _statusService
            .GetStatusAsync(cancellationToken)
            .ConfigureAwait(false);

        return Ok(result);
    }
}
