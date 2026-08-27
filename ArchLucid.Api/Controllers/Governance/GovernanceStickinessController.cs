using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>TB-057–061 stickiness workflow APIs: risk register, dispositions, waivers, decision register.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/governance")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed partial class GovernanceStickinessController(
    IGovernanceStickinessFacade facade,
    IScopeContextProvider scopeContextProvider,
    ITenantRepository tenantRepository,
    IActorContext actorContext) : ControllerBase
{
    private readonly IGovernanceStickinessFacade _facade =
        facade ?? throw new ArgumentNullException(nameof(facade));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private const int RegisterMaxRowsLimit = 500;
    private const int MaxFindingIdLength = 200;
    private const int MaxActorIdLength = 256;

    private IActionResult? ValidateMergeConflictResolutionAction(
        ArchLucid.Contracts.Findings.FindingMergeConflictResolutionAction action)
    {
        if ((int)action is < 0 or > (int)ArchLucid.Contracts.Findings.FindingMergeConflictResolutionAction.KeepBoth)
        {
            return this.BadRequestProblem(
                "action must be a valid finding merge conflict resolution action.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private IActionResult? ValidateRegisterMaxRows(int maxRows)
    {
        if (maxRows <= 0)
            return this.BadRequestProblem("maxRows must be greater than 0.", ProblemTypes.ValidationFailed);

        if (maxRows > RegisterMaxRowsLimit)
            return this.BadRequestProblem("maxRows must be at most 500.", ProblemTypes.ValidationFailed);

        return null;
    }

    private IActionResult? ValidateQueryProjectId(Guid? projectId)
    {
        if (!GovernanceQueryRequestValidationRules.IsUsableProjectId(projectId))
            return this.BadRequestProblem("projectId must not be an empty GUID.", ProblemTypes.ValidationFailed);

        return null;
    }

    private IActionResult? ValidateRouteGuid(Guid value, string fieldName)
    {
        if (!GovernanceQueryRequestValidationRules.IsUsableRequiredGuid(value))
            return this.BadRequestProblem($"{fieldName} must not be an empty GUID.", ProblemTypes.ValidationFailed);

        return null;
    }

    private IActionResult? ValidateFindingIdRoute(string findingId, out string normalizedFindingId)
    {
        normalizedFindingId = findingId.Trim();

        if (string.IsNullOrEmpty(normalizedFindingId))
            return this.BadRequestProblem("findingId is required.", ProblemTypes.ValidationFailed);

        if (normalizedFindingId.Length > MaxFindingIdLength)
        {
            return this.BadRequestProblem(
                "FindingId must not exceed 200 characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private IActionResult? ValidateDecisionRegisterFilters(
        DateTimeOffset? recordedAfterUtc,
        DateTimeOffset? recordedBeforeUtc,
        double? minConfidence,
        double? maxConfidence,
        string? category,
        string? buyerConfidenceSource)
    {
        if (category is not null && string.IsNullOrWhiteSpace(category))
        {
            return this.BadRequestProblem(
                "category is required.",
                ProblemTypes.ValidationFailed);
        }

        if (buyerConfidenceSource is not null && string.IsNullOrWhiteSpace(buyerConfidenceSource))
        {
            return this.BadRequestProblem(
                "buyerConfidenceSource is required.",
                ProblemTypes.ValidationFailed);
        }

        if (recordedAfterUtc.HasValue && recordedBeforeUtc.HasValue && recordedAfterUtc > recordedBeforeUtc)
        {
            return this.BadRequestProblem(
                "recordedAfterUtc must be before recordedBeforeUtc.",
                ProblemTypes.ValidationFailed);
        }

        if (minConfidence.HasValue && maxConfidence.HasValue && minConfidence > maxConfidence)
        {
            return this.BadRequestProblem(
                "minConfidence must be less than or equal to maxConfidence.",
                ProblemTypes.ValidationFailed);
        }

        if (minConfidence is < 0d or > 100d)
        {
            return this.BadRequestProblem(
                "minConfidence must be between 0 and 100.",
                ProblemTypes.ValidationFailed);
        }

        if (maxConfidence is < 0d or > 100d)
        {
            return this.BadRequestProblem(
                "maxConfidence must be between 0 and 100.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private IActionResult? ValidateActorIdLength()
    {
        string actorId = _actorContext.GetActorId();

        if (actorId.Length > MaxActorIdLength)
        {
            return this.BadRequestProblem(
                "Actor id must not exceed 256 characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private IActionResult? ValidateBulkDispositionRequest(RecordBulkFindingDispositionRequest request)
    {
        string probeFindingId = request.FindingIds
            .First(id => !string.IsNullOrWhiteSpace(id))
            .Trim();

        try
        {
            FindingDispositionValidation.Validate(
                new RecordFindingDispositionRequest
                {
                    FindingId = probeFindingId,
                    Disposition = request.Disposition,
                    Rationale = request.Rationale,
                    RevisitDueUtc = request.RevisitDueUtc,
                });
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private async Task<IActionResult?> RequireTenantOrNotFoundAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        return null;
    }
}
