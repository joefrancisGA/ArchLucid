using System.Security.Claims;
using System.Text.Json;

using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Internal deployment-status view for authorized operators (AdminAuthority).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class AdminDeploymentStatusController(
    IAdminDeploymentStatusQuery deploymentStatusQuery,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    private readonly IAdminDeploymentStatusQuery _deploymentStatusQuery =
        deploymentStatusQuery ?? throw new ArgumentNullException(nameof(deploymentStatusQuery));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <summary>
    ///     Returns a non-secret deployment identity and agreement snapshot.
    ///     Pass <paramref name="frontendBuildId"/> from the UI shell so agreement can be evaluated.
    /// </summary>
    [HttpGet("deployment-status")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(AdminDeploymentStatusResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminDeploymentStatusResponse>> GetDeploymentStatusAsync(
        [FromQuery] string? frontendBuildId,
        CancellationToken cancellationToken)
    {
        AdminDeploymentStatusResponse response =
            await _deploymentStatusQuery.GetAsync(frontendBuildId, cancellationToken).ConfigureAwait(false);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actor = User.FindFirstValue(ClaimTypes.NameIdentifier)
                       ?? User.FindFirstValue("sub")
                       ?? User.Identity?.Name
                       ?? "unknown";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AdminDeploymentStatusViewed,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        environment = response.Environment,
                        overallStatus = response.OverallStatus,
                        componentAgreement = response.ComponentAgreement,
                        releaseBuildId = response.ReleaseBuildId,
                    }),
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(response);
    }
}
