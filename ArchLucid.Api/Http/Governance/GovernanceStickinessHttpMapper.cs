using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Api.Http.Governance;

/// <summary>Request validation for governance stickiness HTTP routes.</summary>
public static class GovernanceStickinessHttpMapper
{
    public const int RegisterMaxRowsLimit = 500;

    public static GovernanceHttpValidation? ValidateRegisterMaxRows(int maxRows)
    {
        if (maxRows <= 0)
            return new GovernanceHttpValidation("maxRows must be greater than 0.", ProblemTypes.ValidationFailed);

        if (maxRows > RegisterMaxRowsLimit)
            return new GovernanceHttpValidation("maxRows must be at most 500.", ProblemTypes.ValidationFailed);

        return null;
    }

    public static GovernanceHttpValidation? ValidateProjectQueryId(Guid? projectId)
    {
        if (GovernanceQueryProjectScope.IsInvalidEmptyProjectQueryId(projectId))
            return new GovernanceHttpValidation("projectId must not be empty.", ProblemTypes.ValidationFailed);

        return null;
    }

    public static GovernanceHttpValidation? ValidateCreateRiskException(CreateRiskExceptionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.RunId == Guid.Empty)
            return new GovernanceHttpValidation("runId is required.", ProblemTypes.ValidationFailed);

        if (string.IsNullOrWhiteSpace(request.FindingId))
            return new GovernanceHttpValidation("findingId is required.", ProblemTypes.ValidationFailed);

        return null;
    }

    public static GovernanceHttpValidation? ValidateRouteGuid(Guid id, string parameterName)
    {
        if (id == Guid.Empty)
            return new GovernanceHttpValidation($"{parameterName} is required.", ProblemTypes.ValidationFailed);

        return null;
    }

    public static GovernanceHttpValidation? ValidateDecisionRegisterFilters(
        string? category,
        DateTimeOffset? recordedAfterUtc,
        DateTimeOffset? recordedBeforeUtc,
        double? minConfidence,
        double? maxConfidence,
        string? buyerConfidenceSource)
    {
        if (category is not null && string.IsNullOrWhiteSpace(category))
        {
            return new GovernanceHttpValidation(
                "category cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (recordedAfterUtc is not null
            && recordedBeforeUtc is not null
            && recordedAfterUtc > recordedBeforeUtc)
        {
            return new GovernanceHttpValidation(
                "recordedAfterUtc must be on or before recordedBeforeUtc.",
                ProblemTypes.ValidationFailed);
        }

        if (minConfidence is not null && maxConfidence is not null && minConfidence > maxConfidence)
        {
            return new GovernanceHttpValidation(
                "minConfidence must be less than or equal to maxConfidence.",
                ProblemTypes.ValidationFailed);
        }

        return ValidateBuyerConfidenceSource(buyerConfidenceSource);
    }

    public static GovernanceHttpValidation? ValidateBuyerConfidenceSource(string? buyerConfidenceSource)
    {
        if (buyerConfidenceSource is null)
            return null;

        if (string.IsNullOrWhiteSpace(buyerConfidenceSource))
        {
            return new GovernanceHttpValidation(
                "buyerConfidenceSource cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        if (!IsKnownBuyerConfidenceSource(buyerConfidenceSource))
        {
            return new GovernanceHttpValidation(
                $"buyerConfidenceSource must be one of: {BuyerDecisionConfidenceSource.EvidenceBacked}, {BuyerDecisionConfidenceSource.ModelAssisted}, or {BuyerDecisionConfidenceSource.Unknown}.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private static bool IsKnownBuyerConfidenceSource(string buyerConfidenceSource) =>
        string.Equals(buyerConfidenceSource, BuyerDecisionConfidenceSource.EvidenceBacked, StringComparison.OrdinalIgnoreCase)
        || string.Equals(buyerConfidenceSource, BuyerDecisionConfidenceSource.ModelAssisted, StringComparison.OrdinalIgnoreCase)
        || string.Equals(buyerConfidenceSource, BuyerDecisionConfidenceSource.Unknown, StringComparison.OrdinalIgnoreCase);
}
