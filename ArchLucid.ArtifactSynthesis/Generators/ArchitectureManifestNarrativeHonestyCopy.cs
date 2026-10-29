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

    internal const string CostCurrencyStoredEmpty = "Cost currency was stored empty.";

    internal const string AssumptionsNotStored = "Assumptions were not stored.";

    internal const string ConstraintsNotStored = "Constraints were not stored.";

    internal const string ConstraintsStoredEmpty = "Constraints were stored empty.";

    internal const string DecisionsNotStored = "Decisions were not stored.";

    internal static string FormatCostCurrency(string? value) =>
        FormatStoredStringField(value, CostCurrencyNotStored, CostCurrencyStoredEmpty);

    internal const string NoSourceFindingIdsStored = "No source finding ids were stored.";

    internal const string NoSourceGraphNodeIdsStored = "No source graph node ids were stored.";

    internal const string NoAppliedRuleIdsStored = "Applied rule ids were stored empty.";

    internal const string AppliedRuleIdsNotStored = "Applied rule ids were not stored.";

    internal const string CostRisksNotStored = "Cost risks were not stored.";

    internal const string CostRisksStoredEmpty = "Cost risks were stored as an empty list.";

    internal const string CostNotesNotStored = "Cost notes were not stored.";

    internal const string CostNotesStoredEmpty = "Cost notes were stored as an empty list.";

    internal const string RequirementsCoverageStoredEmpty = "Requirements coverage was stored as an empty list.";

    internal const string SecurityControlsNotStored = "Security controls were not stored.";

    internal const string SecurityControlsStoredEmpty = "Security controls were stored as an empty list.";

    internal const string ServicesNotStored = "Services were not stored.";

    internal const string ServicesStoredEmpty = "Services were stored as an empty list.";

    internal const string DatastoresNotStored = "Datastores were not stored.";

    internal const string DatastoresStoredEmpty = "Datastores were stored as an empty list.";

    internal const string RelationshipsNotStored = "Relationships were not stored.";

    internal const string RelationshipsStoredEmpty = "Relationships were stored as an empty list.";

    internal const string AssumptionsStoredEmpty = "Assumptions were stored as an empty list.";

    internal const string MandatoryConstraintsStoredEmpty = "Mandatory constraints were stored as an empty list.";

    internal const string ConstraintPreferencesStoredEmpty = "Constraint preferences were stored as an empty list.";

    internal const string DecisionsStoredEmpty = "Decisions were stored as an empty list.";

    internal const string UnresolvedIssuesNotStored = "Unresolved issues were not stored.";

    internal const string UnresolvedIssuesStoredEmpty = "Unresolved issues were stored as an empty list.";

    internal const string SupportingFindingsStoredEmpty = "Supporting findings were stored empty.";

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
