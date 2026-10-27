namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Shared omission copy for architecture review board HTML, DOCX, and PDF exports.</summary>
internal static class ArchitectureReviewBoardExportHonestyCopy
{
    internal const string SystemNameNotStored = "System name was not stored.";

    internal const string SponsorReportNotStored = "Sponsor report was not stored.";

    internal const string ManifestVersionNotStored = "Manifest version was not stored.";

    internal const string MermaidDiagramSourceNotStored = "Mermaid diagram source was not stored.";

    internal const string DecisionRecordedTimeNotStored = "Recorded time was not stored.";

    internal const string RecommendedActionStoredEmpty = "Recommended action was stored empty.";

    internal const string DispositionSummaryStoredEmpty = "Disposition summary was stored empty.";

    internal static string SectionNotStored(string itemPhrase) => $"{itemPhrase} section was not stored.";
}
