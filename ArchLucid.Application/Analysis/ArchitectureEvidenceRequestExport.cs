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

    internal const string RequiredControlsNotStoredCopy = "Required controls were not stored.";

    internal const string CurrentManifestVersionNotStoredCopy = "Current manifest version was not stored.";

    internal const string ParentManifestVersionNotStoredCopy = "Parent manifest version was not stored.";

    internal const string ParentManifestVersionStoredEmptyCopy = "Parent manifest version was stored empty.";

    internal const string ServicePurposeNotStoredCopy = "Purpose was not stored.";

    internal const string DatastoreNameNotStoredCopy = "Datastore name was not stored.";

    internal const string NoPolicyEvidenceRowsStoredCopy = "No policy evidence rows were stored.";

    internal const string NoServiceCatalogRowsStoredCopy = "No service catalog rows were stored.";

    internal const string NoPatternRowsStoredCopy = "No pattern rows were stored.";

    internal const string RecommendedUseCasesNotStoredCopy = "Recommended use cases were not stored.";

    internal const string SuggestedServicesNotStoredCopy = "Suggested services were not stored.";

    internal const string ParsedResultNotStoredCopy = "Parsed result was not stored.";

    internal const string TraceTaskIdNotStoredCopy = "Task id was not stored.";

    internal const string EmptyDiffListBulletCopy = "No entries were stored in this list.";

    internal const string DiffEntryStoredEmptyCopy = "Diff entry was stored empty.";

    internal const string LeftRunIdNotStoredCopy = "Left run id was not stored.";

    internal const string RightRunIdNotStoredCopy = "Right run id was not stored.";

    internal const string LeftExportRecordIdNotStoredCopy = "Left export record id was not stored.";

    internal const string RightExportRecordIdNotStoredCopy = "Right export record id was not stored.";

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

    internal const string TraceParsedResultNotStoredCopy = "Parsed result was not stored.";

    internal const string TraceParsedResultStoredEmptyCopy = "Parsed result was stored empty.";

    internal const string TraceErrorNotStoredCopy = "Error was not stored.";

    internal const string TraceErrorStoredEmptyCopy = "Error was stored empty.";

    internal const string DiagramNotStoredCopy = "Diagram was not stored.";

    internal const string ArchitectureSummaryNotStoredCopy = "Architecture summary was not stored.";

    internal static string FormatIdentityField(string? value, string missingCopy) =>
        FormatIdentityField(value, missingCopy, $"{missingCopy.Replace(" was not stored.", "", StringComparison.Ordinal)} was stored empty.");

    internal static string FormatIdentityField(string? value, string notStoredCopy, string storedEmptyCopy) =>
        value switch
        {
            null => notStoredCopy,
            _ when value.Length == 0 => storedEmptyCopy,
            _ when string.IsNullOrWhiteSpace(value) => storedEmptyCopy,
            _ => value.Trim(),
        };

    internal static string FormatDescription(string? description) =>
        FormatIdentityField(description, MissingDescriptionCopy, "Request description was stored empty.");

    internal static string FormatSummary(string? summary, string missingCopy) =>
        FormatIdentityField(summary, missingCopy, missingCopy.Replace(" was not stored.", " was stored empty.", StringComparison.Ordinal));

    internal static string FormatTraceField(string? value, string notStoredCopy, string storedEmptyCopy) =>
        value switch
        {
            null => notStoredCopy,
            _ when value.Length == 0 => storedEmptyCopy,
            _ when string.IsNullOrWhiteSpace(value) => storedEmptyCopy,
            _ => value,
        };

    internal static string FormatTraceErrorForExport(string? errorMessage, bool parseSucceeded)
    {
        if (parseSucceeded && errorMessage is null)
        {
            return "No error was stored because parsing succeeded.";
        }

        if (!parseSucceeded && errorMessage is null)
        {
            return TraceErrorNotStoredCopy;
        }

        return FormatTraceField(errorMessage, TraceErrorNotStoredCopy, TraceErrorStoredEmptyCopy);
    }

    internal static string FormatDiffListEntry(string? entry) =>
        string.IsNullOrWhiteSpace(entry) ? DiffEntryStoredEmptyCopy : entry.Trim();
}
