using ArchLucid.Application.Billing;
using ArchLucid.Contracts.Billing;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Tenant-scoped estimated LLM cost reporting (Batch B item 18).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant")]
public sealed class TenantLlmCostReportingController(ITenantLlmCostReportingService reportingService) : ControllerBase
{
    [HttpGet("llm-cost-reporting")]
    [ProducesResponseType(typeof(LlmCostReportingDashboardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<LlmCostReportingDashboardResponse>> GetDashboard(
        [FromQuery] int days = 30,
        CancellationToken cancellationToken = default)
    {
        LlmCostReportingDashboardResponse dashboard =
            await reportingService.BuildDashboardAsync(days, cancellationToken).ConfigureAwait(false);

        return Ok(dashboard);
    }
}
