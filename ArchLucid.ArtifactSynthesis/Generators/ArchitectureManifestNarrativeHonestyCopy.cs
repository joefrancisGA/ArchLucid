namespace ArchLucid.ArtifactSynthesis.Generators;

using ArchLucid.Core.Manifest.Sections;

internal static class ArchitectureManifestNarrativeHonestyCopy
{
    internal const string RequirementNameNotStored = "Requirement name was not stored.";

    internal const string MandatoryFlagNotStored = "Mandatory flag was not stored.";

    internal const string CoverageStatusNotStored = "Coverage status was not stored.";

    internal const string ImpactNotStored = "Impact was not stored.";

    internal const string ImpactStoredEmpty = "Impact was stored empty.";

    internal const string StatusNotStored = "Status was not stored.";

    internal const string StatusStoredEmpty = "Control status was stored empty.";

    internal const string ControlIdNotStored = "Control id was not stored.";

    internal const string ControlNameNotStored = "Control name was not stored.";

    internal const string DecisionCategoryNotStored = "Decision category was not stored.";

    internal const string DecisionTitleNotStored = "Decision title was not stored.";

    internal const string IssueSeverityNotStored = "Severity was not stored.";

    internal const string IssueTypeNotStored = "Issue type was not stored.";

    internal const string IssueTitleNotStored = "Issue title was not stored.";

    internal const string IssueDescriptionNotStored = "Issue description was not stored.";

    internal const string MaxMonthlyCostNotStored = "Max monthly cost was not stored.";

    internal const string CostCurrencyNotStored = "Cost currency was not stored.";

    internal const string NoSourceFindingIdsStored = "No source finding ids were stored.";

    internal const string NoSourceGraphNodeIdsStored = "No source graph node ids were stored.";

    internal const string NoAppliedRuleIdsStored = "No applied rule ids were stored.";

    internal static string FormatMandatoryFlag(RequirementCoverageItem item)
    {
        if (string.Equals(item.CoverageStatus, "Uncovered", StringComparison.Ordinal))
        {
            return MandatoryFlagNotStored;
        }

        return item.IsMandatory ? "yes" : "no";
    }

    internal static string FormatMandatoryFlagDocx(RequirementCoverageItem item)
    {
        if (string.Equals(item.CoverageStatus, "Uncovered", StringComparison.Ordinal))
        {
            return MandatoryFlagNotStored;
        }

        return item.IsMandatory ? "Yes" : "No";
    }

    internal static string FormatOptionalField(string? value, string missingCopy) =>
        string.IsNullOrWhiteSpace(value) ? missingCopy : value.Trim();

    internal static string FormatStoredStringField(string? value, string notStoredCopy, string storedEmptyCopy)
    {
        if (value is null)
        {
            return notStoredCopy;
        }

        if (value.Length == 0)
        {
            return storedEmptyCopy;
        }

        string trimmed = value.Trim();

        return trimmed.Length == 0 ? storedEmptyCopy : trimmed;
    }
}
