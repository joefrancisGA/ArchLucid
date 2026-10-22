using ArchLucid.Application.CustomerSuccess;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.CustomerSuccess;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Internal tenant health scores for customer-success triage (TB-228).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.PlatformInternalOperationsAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class AdminCustomerSuccessController(IAdminTenantHealthReader adminTenantHealthReader) : ControllerBase
{
    private readonly IAdminTenantHealthReader _adminTenantHealthReader =
        adminTenantHealthReader ?? throw new ArgumentNullException(nameof(adminTenantHealthReader));

    [HttpGet("tenant-health")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(AdminTenantHealthListResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminTenantHealthListResponse>> GetTenantHealthAsync(CancellationToken cancellationToken)
    {
        IReadOnlyList<AdminTenantHealthSummaryRow> rows =
            await _adminTenantHealthReader.ListSummariesAsync(cancellationToken).ConfigureAwait(false);

        AdminTenantHealthSummaryItem[] items = rows
            .Select(static row => new AdminTenantHealthSummaryItem
            {
                TenantId = row.TenantId,
                WorkspaceId = row.WorkspaceId,
                ProjectId = row.ProjectId,
                EngagementScore = row.EngagementScore,
                GovernanceScore = row.GovernanceScore,
                PilotFunnelStage = AdminPilotFunnelStageDeriver.Derive(
                    row.TotalRuns,
                    row.CommittedRuns,
                    row.ComparisonEventsLast30Days),
                RunsLast7d = row.RunsLast7d,
                CommitsLast7d = row.CommitsLast7d,
                LastActivityUtc = row.LastActivityUtc
            })
            .ToArray();

        return Ok(new AdminTenantHealthListResponse { Items = items });
    }
}
