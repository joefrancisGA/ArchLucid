using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Pre-commit gate simulation against persisted findings plus optional synthetic injections.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance/pre-commit")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class GovernancePreCommitSimulationController(IPreCommitGovernanceGate gate) : ControllerBase
{
    [HttpPost("simulate")]
    [ProducesResponseType(typeof(PreCommitGateResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SimulateAsync(
        [FromBody] PreCommitSyntheticSimulationRequest? body,
        CancellationToken cancellationToken = default)
    {
        if (body is null)

            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);


        if (!TryParseRunId(body.RunId.Trim(), out string runIdNormalized))
            return this.BadRequestProblem(
                $"Run ID '{body.RunId}' is not valid.",
                ProblemTypes.BadRequest);


        PreCommitGateResult outcome = await gate.SimulateSyntheticFindingsAsync(
            runIdNormalized,
            body.SyntheticSeverity,
            body.SyntheticCount,
            cancellationToken);


        return Ok(outcome);
    }

    /// <remarks>
    ///     Accepts <c>guid</c> or compact <see cref="string" /> form used elsewhere in orchestration tooling.
    /// </remarks>
    private static bool TryParseRunId(string raw, out string normalizedId)
    {
        normalizedId = raw;

        return Guid.TryParse(raw, out _);
    }
}
