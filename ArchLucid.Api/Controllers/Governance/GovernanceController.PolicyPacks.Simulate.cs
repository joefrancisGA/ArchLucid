using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    /// <summary>
    ///     Simulates proposed pack content against a single run's findings (pre-commit gate semantics) without persisting a pack.
    /// </summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("simulate")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [EnableRateLimiting("governancePolicyPackDryRun")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PolicyPackGovernanceDryRunResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Simulate(
        [FromBody] PolicyPackSimulateRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? runIdValidation =
            GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRunId(request.RunId)
                .ToBadRequestProblemOrNull(this);

        if (runIdValidation is not null)
            return runIdValidation;

        if (!Guid.TryParse(request.RunId.Trim(), out Guid runGuid) || runGuid == Guid.Empty)
        {
            return this.BadRequestProblem("runId is not valid.", ProblemTypes.ValidationFailed);
        }

        if (request.Content is null)
        {
            return this.BadRequestProblem("content is required.", ProblemTypes.ValidationFailed);
        }

        IActionResult? validationProblem =
            PolicyPackSimulateHttpMapper.Validate(request).ToBadRequestProblemOrNull(this);

        if (validationProblem is not null)
            return validationProblem;

        PolicyPackHttpResult<PolicyPackGovernanceDryRunResult> result = await _policyPackHttpFacade.SimulateAsync(
            request.Content,
            request.RunId,
            request.BlockCommitOnCritical,
            request.BlockCommitMinimumSeverity,
            request.ProposedPolicyPackId,
            cancellationToken).ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                "The target run was not found in the current tenant/workspace/project scope.");
        }

        return Ok(result.Value!);
    }
}
