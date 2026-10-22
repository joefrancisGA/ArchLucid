using ArchLucid.Application.Diagnostics;
using ArchLucid.Contracts.Diagnostics;
using ArchLucid.Core.Authorization;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Diagnostics;

/// <summary>Live workspace AI availability probes for review failure recovery.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/diagnostics")]
[EnableRateLimiting("expensive")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class WorkspaceAiAvailabilityController(IWorkspaceAiAvailabilityService availabilityService) : ControllerBase
{
    private readonly IWorkspaceAiAvailabilityService _availabilityService =
        availabilityService ?? throw new ArgumentNullException(nameof(availabilityService));

    /// <summary>Runs non-mutating AI availability probes for the current workspace (no secret values returned).</summary>
    [HttpGet("workspace-ai-availability")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(WorkspaceAiAvailabilityResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkspaceAiAvailabilityResponse>> GetAsync(CancellationToken cancellationToken)
    {
        WorkspaceAiAvailabilityResponse response =
            await _availabilityService.ProbeAsync(cancellationToken).ConfigureAwait(false);

        return Ok(response);
    }
}
