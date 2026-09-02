using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Asp.Versioning;

using FluentValidation;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>
///     Versioned policy pack CRUD, publish, assign, and effective-governance reads for the ambient
///     tenant/workspace/project.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/policy-packs")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public sealed partial class PolicyPacksController(
    IPolicyPackHttpFacade httpFacade,
    IValidator<CreatePolicyPackRequest> createPolicyPackRequestValidator,
    IValidator<PublishPolicyPackVersionRequest> publishPolicyPackVersionRequestValidator,
    IValidator<AssignPolicyPackRequest> assignPolicyPackRequestValidator)
    : ControllerBase
{
    private readonly IPolicyPackHttpFacade _httpFacade =
        httpFacade ?? throw new ArgumentNullException(nameof(httpFacade));

    private readonly IValidator<CreatePolicyPackRequest> _createPolicyPackRequestValidator =
        createPolicyPackRequestValidator ?? throw new ArgumentNullException(nameof(createPolicyPackRequestValidator));

    private readonly IValidator<PublishPolicyPackVersionRequest> _publishPolicyPackVersionRequestValidator =
        publishPolicyPackVersionRequestValidator
        ?? throw new ArgumentNullException(nameof(publishPolicyPackVersionRequestValidator));

    private readonly IValidator<AssignPolicyPackRequest> _assignPolicyPackRequestValidator =
        assignPolicyPackRequestValidator ?? throw new ArgumentNullException(nameof(assignPolicyPackRequestValidator));

    private IActionResult? BadRequestWhenRouteIdEmpty(Guid id, string parameterName) =>
        PolicyPacksHttpMapper.ValidateRouteId(id, parameterName).ToBadRequestProblemOrNull(this);

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
}
