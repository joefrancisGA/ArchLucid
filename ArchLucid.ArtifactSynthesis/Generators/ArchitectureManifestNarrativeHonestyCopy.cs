namespace ArchLucid.ArtifactSynthesis.Generators;

internal static class ArchitectureManifestNarrativeHonestyCopy
{
    internal const string RequirementNameNotStored = "Requirement name was not stored.";

    internal const string CoverageStatusNotStored = "Coverage status was not stored.";

    internal const string ImpactNotStored = "Impact was not stored.";

    internal const string StatusNotStored = "Status was not stored.";

    internal const string DecisionCategoryNotStored = "Decision category was not stored.";

    internal const string DecisionTitleNotStored = "Decision title was not stored.";

    internal const string IssueSeverityNotStored = "Severity was not stored.";

    internal const string IssueTypeNotStored = "Issue type was not stored.";

    internal const string IssueTitleNotStored = "Issue title was not stored.";

    internal const string IssueDescriptionNotStored = "Issue description was not stored.";

    internal const string MaxMonthlyCostNotStored = "Max monthly cost was not stored.";

    internal const string NoSourceFindingIdsStored = "No source finding ids were stored.";

    internal const string NoSourceGraphNodeIdsStored = "No source graph node ids were stored.";

    internal const string NoAppliedRuleIdsStored = "No applied rule ids were stored.";

    internal static string FormatOptionalField(string? value, string missingCopy)
    {
        if (value is null)
        {
            return missingCopy;
        }

        if (value.Length == 0 || string.IsNullOrWhiteSpace(value))
        {
            const string notStoredSuffix = " was not stored.";
            if (missingCopy.EndsWith(notStoredSuffix, StringComparison.Ordinal))
            {
                return missingCopy[..^notStoredSuffix.Length] + " was stored empty.";
            }

            return $"{missingCopy.TrimEnd('.')} stored empty.";
        }

        return value.Trim();
    }
}
