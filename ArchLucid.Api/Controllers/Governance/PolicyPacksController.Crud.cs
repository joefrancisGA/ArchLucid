using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Authorization;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class PolicyPacksController
{
    /// <summary>Creates a new pack and an initial unpublished version <c>1.0.0</c>.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(typeof(PolicyPack), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePolicyPackRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? validationProblem =
            await this.ValidateRequestAsync(_createPolicyPackRequestValidator, request, ct);

        if (validationProblem is not null)
            return validationProblem;

        PolicyPackHttpResult<PolicyPack> result = await _httpFacade.CreatePackAsync(
            new PolicyPackCreateBody
            {
                Name = request.Name,
                Description = request.Description,
                PackType = request.PackType,
                InitialContentJson = request.InitialContentJson,
            },
            ct).ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        return Ok(result.Value!);
    }

    /// <summary>Publishes or upserts a version for the pack and marks the pack active.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{policyPackId:guid}/publish")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(typeof(PolicyPackVersion), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Publish(
        Guid policyPackId,
        [FromBody] PublishPolicyPackVersionRequest? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? validationProblem =
            await this.ValidateRequestAsync(_publishPolicyPackVersionRequestValidator, request, ct);

        if (validationProblem is not null)
            return validationProblem;

        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(policyPackId, "policyPackId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        PolicyPackHttpResult<PolicyPackVersion> result = await _httpFacade.PublishVersionAsync(
            policyPackId,
            new PolicyPackPublishBody
            {
                Version = request.Version,
                ContentJson = request.ContentJson,
            },
            ct).ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Policy pack '{policyPackId}' was not found in the current scope.");
        }

        return Ok(result.Value!);
    }

    /// <summary>Soft-deletes a policy pack.</summary>
    [HttpDelete("{policyPackId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePack(Guid policyPackId, CancellationToken ct = default)
    {
        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(policyPackId, "policyPackId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        PolicyPackHttpResult<bool> result = await _httpFacade.SoftDeletePackAsync(policyPackId, ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Policy pack '{policyPackId}' was not found in the current scope.");
        }

        return NoContent();
    }

    /// <summary>Duplicates a policy pack and its latest version content.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{policyPackId:guid}/duplicate")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [ProducesResponseType(typeof(PolicyPack), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DuplicatePack(Guid policyPackId, CancellationToken ct = default)
    {
        IActionResult? routeIdProblem = BadRequestWhenRouteIdEmpty(policyPackId, "policyPackId");

        if (routeIdProblem is not null)
            return routeIdProblem;

        PolicyPackHttpResult<PolicyPack> result = await _httpFacade.DuplicatePackAsync(policyPackId, ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        if (result.Outcome == PolicyPackHttpOutcome.ResourceNotFound)
        {
            return this.MapResourceNotFound(
                result,
                $"Policy pack '{policyPackId}' was not found or has no versions to duplicate.");
        }

        return Ok(result.Value!);
    }

    /// <summary>Lists packs whose authoring scope matches the current tenant/workspace/project.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PolicyPack>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> List(CancellationToken ct = default)
    {
        PolicyPackHttpResult<IReadOnlyList<PolicyPack>> result = await _httpFacade.ListVisiblePacksAsync(ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        return Ok(result.Value!);
    }
}
