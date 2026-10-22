using ArchLucid.Api.ProblemDetails;

namespace ArchLucid.Api.Http.Governance;

/// <summary>HTTP query validation for manifest diagram v2 options (parity with summary format guards).</summary>
public static class ManifestDiagramQueryValidation
{
    public static GovernanceHttpValidation? ValidateLayout(string? layout)
    {
        if (layout is null)
            return null;

        if (string.IsNullOrWhiteSpace(layout))
        {
            return new GovernanceHttpValidation(
                "layout cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        string normalized = layout.Trim();

        if (string.Equals(normalized, "LR", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "TB", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return new GovernanceHttpValidation(
            "layout must be 'LR' or 'TB'.",
            ProblemTypes.ValidationFailed);
    }

    public static GovernanceHttpValidation? ValidateRelationshipLabels(string? relationshipLabels)
    {
        if (relationshipLabels is null)
            return null;

        if (string.IsNullOrWhiteSpace(relationshipLabels))
        {
            return new GovernanceHttpValidation(
                "relationshipLabels cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        string normalized = relationshipLabels.Trim();

        if (string.Equals(normalized, "type", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "none", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return new GovernanceHttpValidation(
            "relationshipLabels must be 'type' or 'none'.",
            ProblemTypes.ValidationFailed);
    }

    public static GovernanceHttpValidation? ValidateGroupBy(string? groupBy)
    {
        if (groupBy is null)
            return null;

        if (string.IsNullOrWhiteSpace(groupBy))
        {
            return new GovernanceHttpValidation(
                "groupBy cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        string normalized = groupBy.Trim();

        if (string.Equals(normalized, "none", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "runtimeplatform", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "servicetype", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return new GovernanceHttpValidation(
            "groupBy must be 'none', 'runtimeplatform', or 'servicetype'.",
            ProblemTypes.ValidationFailed);
    }
}
