using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Shared request validation for governance stickiness controller route families.</summary>
internal static class GovernanceStickinessControllerCore
{
    public static GovernanceHttpValidation? ValidateRequestBodyRequired<T>(T? body) where T : class
    {
        if (body is null)
            return new GovernanceHttpValidation("Request body is required.", ProblemTypes.RequestBodyRequired);

        return null;
    }

    public static GovernanceHttpValidation? ValidateRegisterListQuery(Guid? projectId, int maxRows)
    {
        GovernanceHttpValidation? maxRowsValidation = GovernanceStickinessHttpMapper.ValidateRegisterMaxRows(maxRows);

        if (maxRowsValidation is not null)
            return maxRowsValidation;

        return GovernanceStickinessHttpMapper.ValidateProjectQueryId(projectId);
    }

    public static GovernanceHttpValidation? ValidateProjectScopedQuery(Guid? projectId) =>
        GovernanceStickinessHttpMapper.ValidateProjectQueryId(projectId);

    public static GovernanceHttpValidation? ValidateDecisionRegisterListQuery(
        Guid? projectId,
        int maxRows,
        string? category,
        DateTimeOffset? recordedAfterUtc,
        DateTimeOffset? recordedBeforeUtc,
        double? minConfidence,
        double? maxConfidence,
        string? buyerConfidenceSource)
    {
        GovernanceHttpValidation? maxRowsValidation = GovernanceStickinessHttpMapper.ValidateRegisterMaxRows(maxRows);

        if (maxRowsValidation is not null)
            return maxRowsValidation;

        GovernanceHttpValidation? filterValidation = GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters(
            category,
            recordedAfterUtc,
            recordedBeforeUtc,
            minConfidence,
            maxConfidence,
            buyerConfidenceSource);

        if (filterValidation is not null)
            return filterValidation;

        return GovernanceStickinessHttpMapper.ValidateProjectQueryId(projectId);
    }

    public static GovernanceHttpValidation? ValidateFindingId(string? findingId, out string normalizedFindingId)
    {
        normalizedFindingId = findingId?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(normalizedFindingId))
            return new GovernanceHttpValidation("findingId is required.", ProblemTypes.ValidationFailed);

        if (normalizedFindingId.Length > GovernanceRequestValidationRules.FindingIdMaxLength)
        {
            return new GovernanceHttpValidation(
                $"findingId must not exceed {GovernanceRequestValidationRules.FindingIdMaxLength} characters.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateBulkDispositionFindingIds(IReadOnlyList<string>? findingIds)
    {
        if (findingIds is null || findingIds.Count == 0)
        {
            return new GovernanceHttpValidation(
                "At least one FindingId must be provided.",
                ProblemTypes.ValidationFailed);
        }

        if (!findingIds.Any(static id => !string.IsNullOrWhiteSpace(id)))
        {
            return new GovernanceHttpValidation(
                "At least one non-empty FindingId must be provided.",
                ProblemTypes.ValidationFailed);
        }

        if (findingIds.Any(static id => string.IsNullOrWhiteSpace(id)))
        {
            return new GovernanceHttpValidation(
                "Each FindingId must be a non-empty string.",
                ProblemTypes.ValidationFailed);
        }

        if (findingIds.Count > 50)
        {
            return new GovernanceHttpValidation(
                "At most 50 finding ids are allowed per request.",
                ProblemTypes.ValidationFailed);
        }

        HashSet<string> seenFindingIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (string findingId in findingIds)
        {
            if (string.IsNullOrWhiteSpace(findingId))
                continue;

            string normalizedFindingId = findingId.Trim();

            if (normalizedFindingId.Length > GovernanceRequestValidationRules.FindingIdMaxLength)
            {
                return new GovernanceHttpValidation(
                    $"Each findingId must not exceed {GovernanceRequestValidationRules.FindingIdMaxLength} characters.",
                    ProblemTypes.ValidationFailed);
            }

            if (!seenFindingIds.Add(normalizedFindingId))
            {
                return new GovernanceHttpValidation(
                    "Duplicate findingId in batch.",
                    ProblemTypes.ValidationFailed);
            }
        }

        return null;
    }

    public static GovernanceHttpValidation? ValidateRunId(Guid? runId)
    {
        if (runId is null || runId == Guid.Empty)
            return new GovernanceHttpValidation("runId is required.", ProblemTypes.ValidationFailed);

        return null;
    }

    public static GovernanceHttpValidation? ValidateScheduleId(Guid scheduleId)
    {
        if (scheduleId == Guid.Empty)
            return new GovernanceHttpValidation("scheduleId is required.", ProblemTypes.ValidationFailed);

        return null;
    }
}
