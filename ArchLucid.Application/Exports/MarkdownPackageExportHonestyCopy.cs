using System.Globalization;

namespace ArchLucid.Application.Exports;

/// <summary>Shared omission copy for markdown architecture package exports.</summary>
internal static class MarkdownPackageExportHonestyCopy
{
    internal const string SystemNameNotStored = "System name was not stored.";

    internal const string DiagramNotStored = "Diagram was not stored.";

    internal const string DiagramStoredNotObservedTrafficDisclaimer =
        "Diagram lines reflect stored inventory relationships. This is not observed traffic.";

    internal const string ArchitectureSummaryNotStored = "Architecture summary was not stored.";

    internal const string EvidencePackageIdNotStored = "Evidence package id was not stored.";

    internal const string EvidencePackageNotStored = "Evidence package was not stored.";

    internal const string RunIdNotStored = "Run ID was not stored.";

    internal const string RequestIdNotStored = "Request ID was not stored.";

    internal const string PolicyCountStoredEmpty = "Policy list was stored empty.";

    internal const string ServiceCatalogCountStoredEmpty = "Service catalog list was stored empty.";

    internal const string PatternHintCountStoredEmpty = "Pattern hint list was stored empty.";

    internal const string EvidenceNoteCountStoredEmpty = "Evidence note list was stored empty.";

    internal static string FormatEvidenceCollectionCount(int count, string storedEmptyCopy) =>
        count == 0 ? storedEmptyCopy : count.ToString(CultureInfo.InvariantCulture);

    internal static string ResolveSystemName(string? systemName) =>
        string.IsNullOrWhiteSpace(systemName) ? SystemNameNotStored : systemName.Trim();

    internal static string ResolveIdentityField(string? value, string notStoredCopy) =>
        string.IsNullOrWhiteSpace(value) ? notStoredCopy : value.Trim();
}
