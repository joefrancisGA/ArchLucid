namespace ArchLucid.Application.Analysis;

/// <summary>Shared omission copy for evidence request fields in architecture analysis exports.</summary>
internal static class ArchitectureEvidenceRequestExport
{
    internal const string MissingDescriptionCopy = "Request description was not stored.";

    internal const string MissingEvidencePackageCopy = "Evidence package was not stored.";

    internal const string MissingSystemNameCopy = "System name was not stored.";

    internal const string MissingEnvironmentCopy = "Environment was not stored.";

    internal const string MissingCloudProviderCopy = "Cloud provider was not stored.";

    internal const string MissingEvidencePackageIdCopy = "Evidence package id was not stored.";

    internal const string ConstraintsNotRecordedCopy = "Constraints were not recorded.";

    internal const string RequiredCapabilitiesNotRecordedCopy = "Required capabilities were not recorded.";

    internal const string AssumptionsNotRecordedCopy = "Assumptions were not recorded.";

    internal const string PolicyEvidenceNotRecordedCopy = "Policy evidence was not recorded.";

    internal const string PolicySummaryNotStoredCopy = "Policy summary was not stored.";

    internal const string ServiceCatalogSummaryNotStoredCopy = "Service catalog summary was not stored.";

    internal const string PatternSummaryNotStoredCopy = "Pattern summary was not stored.";

    internal const string PolicyTitleNotStoredCopy = "Policy title was not stored.";

    internal const string PolicyIdNotStoredCopy = "Policy id was not stored.";

    internal const string RequiredControlsNotRecordedCopy = "Required controls were not recorded.";

    internal const string ServiceCatalogEvidenceNotRecordedCopy = "Service catalog evidence was not recorded.";

    internal const string ServiceNameNotStoredCopy = "Service name was not stored.";

    internal const string ServiceCategoryNotStoredCopy = "Service category was not stored.";

    internal const string PatternEvidenceNotRecordedCopy = "Pattern evidence was not recorded.";

    internal const string PatternNameNotStoredCopy = "Pattern name was not stored.";

    internal const string PatternIdNotStoredCopy = "Pattern id was not stored.";

    internal const string TraceSystemPromptNotStoredCopy = "System prompt was not stored.";

    internal const string TraceSystemPromptStoredEmptyCopy = "System prompt was stored empty.";

    internal const string TraceUserPromptNotStoredCopy = "User prompt was not stored.";

    internal const string TraceUserPromptStoredEmptyCopy = "User prompt was stored empty.";

    internal const string TraceRawResponseNotStoredCopy = "Raw response was not stored.";

    internal const string TraceRawResponseStoredEmptyCopy = "Raw response was stored empty.";

    internal const string MissingCompletedTimeCopy = "Completed time was not stored.";

    internal const string DiagramNotStoredCopy = "Diagram was not stored.";

    internal const string ArchitectureSummaryNotStoredCopy = "Architecture summary was not stored.";

    internal static string FormatDescription(string? description) =>
        string.IsNullOrWhiteSpace(description) ? MissingDescriptionCopy : description.Trim();

    internal static string FormatIdentityField(string? value, string missingCopy) =>
        string.IsNullOrWhiteSpace(value) ? missingCopy : value.Trim();

    internal static string FormatSummary(string? summary, string missingCopy) =>
        string.IsNullOrWhiteSpace(summary) ? missingCopy : summary.Trim();

    internal static string FormatTraceField(string? value, string notStoredCopy, string storedEmptyCopy) =>
        value switch
        {
            null => notStoredCopy,
            _ when value.Length == 0 => storedEmptyCopy,
            _ when string.IsNullOrWhiteSpace(value) => storedEmptyCopy,
            _ => value,
        };
}
