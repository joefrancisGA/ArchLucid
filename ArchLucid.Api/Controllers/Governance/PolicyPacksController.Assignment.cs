using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class PolicyPacksController
{
    /// <summary>Assigns an existing published version to a governance tier for the current scope.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{policyPackId:guid}/assign")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(typeof(PolicyPackAssignment), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Assign(
        Guid policyPackId,
        [FromBody] AssignPolicyPackRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? validationProblem =
            await this.ValidateRequestAsync(_assignPolicyPackRequestValidator, request, ct);

        if (validationProblem is not null)
            return validationProblem;

        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(policyPackId, "policyPackId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        PolicyPackAssignHttpResult result = await _httpFacade.AssignAsync(
            policyPackId,
            new PolicyPackAssignBody
            {
                Version = request.Version,
                ScopeLevel = request.ScopeLevel,
                IsPinned = request.IsPinned,
            },
            ct).ConfigureAwait(false);

        return this.MapAssign(result);
    }

    /// <summary>Soft-deletes a policy pack assignment for the current tenant (row retained for audit).</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("assignments/{assignmentId:guid}/archive")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveAssignment(Guid assignmentId, CancellationToken ct = default)
    {
        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(assignmentId, "assignmentId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        PolicyPackHttpResult<bool> result = await _httpFacade.ArchiveAssignmentAsync(assignmentId, ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Assignment '{assignmentId}' was not found or is already archived for this tenant.");
        }

        return NoContent();
    }

    /// <summary>Enables or disables one policy pack assignment for the current workspace scope.</summary>
    [HttpPut("assignments/{assignmentId:guid}/enabled")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [MutatingAuditExcluded("Audit: IPolicyPackHttpFacade.SetAssignmentEnabledAsync logs PolicyPackAssignmentEnabledChanged.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetAssignmentEnabled(
        Guid assignmentId,
        [FromBody] SetPolicyPackAssignmentEnabledRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(assignmentId, "assignmentId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        PolicyPackHttpResult<bool> result = await _httpFacade.SetAssignmentEnabledAsync(
                assignmentId,
                request.IsEnabled,
                ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Assignment '{assignmentId}' was not found or cannot be enabled in the current scope.");
        }

        return NoContent();
    }

    /// <summary>Marks or clears organization-required lock on one policy pack assignment for the current scope.</summary>
    [HttpPut("assignments/{assignmentId:guid}/organization-required")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [MutatingAuditExcluded("Audit: IPolicyPackHttpFacade.SetAssignmentOrganizationRequiredAsync logs PolicyPackAssignmentOrganizationRequiredChanged.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetAssignmentOrganizationRequired(
        Guid assignmentId,
        [FromBody] SetPolicyPackAssignmentOrganizationRequiredRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(assignmentId, "assignmentId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        PolicyPackHttpResult<bool> result = await _httpFacade.SetAssignmentOrganizationRequiredAsync(
                assignmentId,
                request.IsOrganizationRequired,
                ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Assignment '{assignmentId}' was not found or cannot be updated in the current scope.");
        }

        return NoContent();
    }
}
