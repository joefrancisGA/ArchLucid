using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Stickiness;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Manifest;
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

    private IActionResult? BadRequestWhenProjectQueryIdEmpty(Guid? projectId)
    {
        if (GovernanceQueryProjectScope.IsInvalidEmptyProjectQueryId(projectId))
            return this.BadRequestProblem("projectId is required.", ProblemTypes.ValidationFailed);

        return null;
    }

    private IActionResult? ValidateDecisionRegisterFilters(
        string? category,
        DateTimeOffset? recordedAfterUtc,
        DateTimeOffset? recordedBeforeUtc,
        double? minConfidence,
        double? maxConfidence,
        string? buyerConfidenceSource)
    {
        if (category is not null && string.IsNullOrWhiteSpace(category))
        {
            return this.BadRequestProblem(
                "category cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (recordedAfterUtc is not null
            && recordedBeforeUtc is not null
            && recordedAfterUtc > recordedBeforeUtc)
        {
            return this.BadRequestProblem(
                "recordedAfterUtc must be on or before recordedBeforeUtc.",
                ProblemTypes.ValidationFailed);
        }

        if (minConfidence is not null && maxConfidence is not null && minConfidence > maxConfidence)
        {
            return this.BadRequestProblem(
                "minConfidence must be less than or equal to maxConfidence.",
                ProblemTypes.ValidationFailed);
        }

        return ValidateBuyerConfidenceSource(buyerConfidenceSource);
    }

    private IActionResult? ValidateBuyerConfidenceSource(string? buyerConfidenceSource)
    {
        if (buyerConfidenceSource is null)
            return null;

        if (string.IsNullOrWhiteSpace(buyerConfidenceSource))
        {
            return this.BadRequestProblem(
                "buyerConfidenceSource cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (!IsKnownBuyerConfidenceSource(buyerConfidenceSource))
        {
            return this.BadRequestProblem(
                $"buyerConfidenceSource must be one of: {BuyerDecisionConfidenceSource.EvidenceBacked}, {BuyerDecisionConfidenceSource.ModelAssisted}, or {BuyerDecisionConfidenceSource.Unknown}.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private static bool IsKnownBuyerConfidenceSource(string buyerConfidenceSource) =>
        string.Equals(buyerConfidenceSource, BuyerDecisionConfidenceSource.EvidenceBacked, StringComparison.OrdinalIgnoreCase)
        || string.Equals(buyerConfidenceSource, BuyerDecisionConfidenceSource.ModelAssisted, StringComparison.OrdinalIgnoreCase)
        || string.Equals(buyerConfidenceSource, BuyerDecisionConfidenceSource.Unknown, StringComparison.OrdinalIgnoreCase);

    private IActionResult? BadRequestWhenProjectQueryIdEmpty(Guid? projectId)
    {
        if (!GovernanceQueryProjectScope.IsInvalidEmptyProjectQueryId(projectId))
            return null;

        return this.BadRequestProblem("projectId cannot be an empty GUID.", ProblemTypes.ValidationFailed);
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
