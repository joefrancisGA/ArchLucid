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

    internal const string MissingCompletedTimeCopy = "Completed time was not stored.";

    internal const string DiagramNotStoredCopy = "Diagram was not stored.";

    internal const string ArchitectureSummaryNotStoredCopy = "Architecture summary was not stored.";

    internal static string FormatDescription(string? description) =>
        string.IsNullOrWhiteSpace(description) ? MissingDescriptionCopy : description.Trim();

    internal static string FormatIdentityField(string? value, string missingCopy) =>
        string.IsNullOrWhiteSpace(value) ? missingCopy : value.Trim();

    internal static string FormatSummary(string? summary, string missingCopy) =>
        string.IsNullOrWhiteSpace(summary) ? missingCopy : summary.Trim();
}
