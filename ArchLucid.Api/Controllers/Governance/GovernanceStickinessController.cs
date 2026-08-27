using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.Stickiness;
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
    ITenantRepository tenantRepository) : ControllerBase
{
    private readonly IGovernanceStickinessFacade _facade =
        facade ?? throw new ArgumentNullException(nameof(facade));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private const int RegisterMaxRowsLimit = 500;

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

    private IActionResult? ValidateFindingIdRoute(string findingId, out string normalizedFindingId)
    {
        normalizedFindingId = findingId.Trim();

        if (string.IsNullOrEmpty(normalizedFindingId))
            return this.BadRequestProblem("findingId is required.", ProblemTypes.ValidationFailed);

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

    private async Task<IActionResult?> RequireTenantOrNotFoundAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        return null;
    }
}
