using ArchLucid.Decisioning.Analysis;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Reviewer-facing omission copy for graph-derived findings and manifest coverage exports.</summary>
public static class DecisioningFindingHonestyCopy
{
    public const string RequirementNameNotStored = "Requirement name was not stored.";

    public const string RequirementTextNotStored = "Requirement text was not stored.";

    public const string RequirementTextStoredEmpty = "Requirement text was stored empty.";

    public const string MandatoryFlagNotStored = "Mandatory flag was not stored.";

    public const string PolicyNameNotStored = "Policy name was not stored.";

    public const string FindingTitleNotStored = "Finding title was not stored.";

    public static string FormatRequirementName(string? value) =>
        string.IsNullOrWhiteSpace(value) ? RequirementNameNotStored : value.Trim();

    public static string FormatRequirementText(string? value)
    {
        if (value is null)
        {
            return RequirementTextNotStored;
        }

        if (value.Length == 0)
        {
            return RequirementTextNotStored;
        }

        return string.IsNullOrWhiteSpace(value) ? RequirementTextStoredEmpty : value.Trim();
    }

    public static string FormatSharedGraphNodeTitleSuffix(string nodeId) =>
        $"Graph node id {nodeId.Trim()} was stored ({GraphNodeReviewerLabel.NotStoredCopy})";
}
