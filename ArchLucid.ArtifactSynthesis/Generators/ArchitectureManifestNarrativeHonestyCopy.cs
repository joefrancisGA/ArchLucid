namespace ArchLucid.ArtifactSynthesis.Generators;

internal static class ArchitectureManifestNarrativeHonestyCopy
{
    internal const string ImpactNotStored = "Impact was not stored.";

    internal const string StatusNotStored = "Status was not stored.";

    internal const string DecisionCategoryNotStored = "Decision category was not stored.";

    internal const string DecisionTitleNotStored = "Decision title was not stored.";

    internal const string IssueSeverityNotStored = "Severity was not stored.";

    internal const string IssueTypeNotStored = "Issue type was not stored.";

    internal const string IssueTitleNotStored = "Issue title was not stored.";

    internal const string IssueDescriptionNotStored = "Issue description was not stored.";

    internal const string MaxMonthlyCostNotStored = "Max monthly cost was not stored.";

    internal static string FormatOptionalField(string? value, string missingCopy) =>
        string.IsNullOrWhiteSpace(value) ? missingCopy : value.Trim();
}
