using ArchLucid.Application.Billing;
using ArchLucid.Contracts.Billing;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Platform-admin fleet LLM COGS and budget utilization (Batch B item 18).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin/operational")]
public sealed class AdminFleetLlmCogsController(IAdminFleetLlmCogsService fleetCogsService) : ControllerBase
{
    [HttpGet("fleet-llm-cogs")]
    [ProducesResponseType(typeof(AdminFleetLlmCogsDashboardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminFleetLlmCogsDashboardResponse>> GetFleetCogs(
        CancellationToken cancellationToken = default)
    {
        AdminFleetLlmCogsDashboardResponse dashboard =
            await fleetCogsService.BuildDashboardAsync(cancellationToken).ConfigureAwait(false);

        return Ok(dashboard);
    }
}
