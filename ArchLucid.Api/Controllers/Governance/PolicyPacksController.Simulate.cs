using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Authorization;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class PolicyPacksController
{
    /// <summary>Simulates proposed pack content against a single run's findings without persisting a pack.</summary>
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

        if (string.IsNullOrWhiteSpace(request.RunId))
            return this.BadRequestProblem("runId is required.", ProblemTypes.ValidationFailed);

        IActionResult? runIdValidation =
            GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRunId(request.RunId)
                .ToBadRequestProblemOrNull(this);

        if (runIdValidation is not null)
            return runIdValidation;

        if (!Guid.TryParse(request.RunId.Trim(), out Guid runGuid) || runGuid == Guid.Empty)
            return this.BadRequestProblem("runId is not valid.", ProblemTypes.ValidationFailed);

        if (request.Content is null)
            return this.BadRequestProblem("content is required.", ProblemTypes.ValidationFailed);

        IActionResult? validationProblem =
            PolicyPackSimulateHttpMapper.Validate(request).ToBadRequestProblemOrNull(this);

        if (validationProblem is not null)
            return validationProblem;

        PolicyPackHttpResult<PolicyPackGovernanceDryRunResult> result = await _httpFacade.SimulateAsync(
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

    /// <summary>Simulates the pack's latest version content against many runs.</summary>
    [HttpPost("{policyPackId:guid}/simulate-bulk")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [EnableRateLimiting("governancePolicyPackDryRun")]
    [ProducesResponseType(typeof(PolicyPackSimulateBulkSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SimulateBulk(
        Guid policyPackId,
        [FromBody] PolicyPackSimulateBulkRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        List<string>? runIds = request.RunIds;

        if (runIds is null || runIds.Count == 0)
            return this.BadRequestProblem("RunIds must contain at least one id.", ProblemTypes.ValidationFailed);

        if (runIds.Count > 50)
            return this.BadRequestProblem("At most 50 run ids are allowed per request.", ProblemTypes.ValidationFailed);

        if (!runIds.Any(static id => !string.IsNullOrWhiteSpace(id)))
        {
            return this.BadRequestProblem(
                "RunIds must contain at least one non-empty id.",
                ProblemTypes.ValidationFailed);
        }

        foreach (string runId in runIds)
        {
            if (string.IsNullOrWhiteSpace(runId))
                continue;

            IActionResult? runIdValidation =
                GovernanceApprovalRequestsHttpMapper.ValidateGovernanceRunId(runId)
                    .ToBadRequestProblemOrNull(this);

            if (runIdValidation is not null)
                return runIdValidation;

            if (!Guid.TryParse(runId.Trim(), out Guid parsedRunGuid) || parsedRunGuid == Guid.Empty)
            {
                return this.BadRequestProblem(
                    "RunIds contains an invalid id.",
                    ProblemTypes.ValidationFailed);
            }
        }

        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(policyPackId, "policyPackId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        IActionResult? validationProblem =
            PolicyPackSimulateBulkHttpMapper.Validate(request).ToBadRequestProblemOrNull(this);

        if (validationProblem is not null)
            return validationProblem;

        PolicyPackHttpResult<PolicyPackSimulateBulkSummary> result = await _httpFacade.SimulateBulkAsync(
            policyPackId,
            runIds,
            request.BlockCommitOnCritical,
            request.BlockCommitMinimumSeverity,
            cancellationToken).ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Policy pack '{policyPackId}' was not found in the current scope.");
        }

        return Ok(MapBulkSummary(result.Value!));
    }

    /// <summary>Validates raw policy pack content JSON against structural rules without persisting a pack.</summary>
    [HttpPost("validate")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [Produces("application/json")]
    [ProducesResponseType(typeof(PolicyPackContentValidationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Validate([FromBody] JsonElement? body, CancellationToken cancellationToken)
    {
        if (body is null || body.Value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (body.Value.ValueKind is not JsonValueKind.Object)
            return this.BadRequestProblem("Expected a JSON object.", ProblemTypes.ValidationFailed);

        IActionResult? validationProblem =
            PolicyPackValidateContentHttpMapper.Validate(body.Value).ToBadRequestProblemOrNull(this);

        if (validationProblem is not null)
            return validationProblem;

        PolicyPackHttpResult<PolicyPackContentValidationResponse> result =
            await _httpFacade.ValidateContentAsync(body.Value, cancellationToken).ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        return Ok(result.Value!);
    }

    private static PolicyPackSimulateBulkSummaryResponse MapBulkSummary(PolicyPackSimulateBulkSummary summary) =>
        new()
        {
            PolicyPackId = summary.PolicyPackId,
            PolicyPackVersion = summary.PolicyPackVersion,
            RequestedRunCount = summary.RequestedRunCount,
            EvaluatedRunCount = summary.EvaluatedRunCount,
            NotFoundRunCount = summary.NotFoundRunCount,
            WouldBlockCommitCount = summary.WouldBlockCommitCount,
            Results = summary.Results
                .Select(static result => new PolicyPackSimulateBulkRunResult
                {
                    RunId = result.RunId,
                    Found = result.Found,
                    WouldBlockCommit = result.WouldBlockCommit,
                    Detail = result.Detail,
                })
                .ToList(),
        };
}
