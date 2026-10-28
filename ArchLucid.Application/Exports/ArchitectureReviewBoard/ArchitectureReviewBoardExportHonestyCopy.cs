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

    internal const string EvidenceConstraintTitle = "Constraint";

    internal const string EvidenceRequiredCapabilityTitle = "Required capability";

    internal const string DecisionTracesOmittedTitle = "Decision traces omitted from this export";

    internal static string AdditionalDecisionTracesOmittedDetail(int omittedCount) =>
        $"{omittedCount} additional decision traces were stored but are not listed in this export package.";

    internal const string AnalysisWarningStoredEmpty = "Analysis warning was stored empty.";

    internal static string AdditionalKeyRisksOmittedDetail(int omittedCount) =>
        $"{omittedCount} additional analysis warnings were stored but are not listed in this export package.";

    internal const string GovernanceConstraintStoredEmpty = "Governance constraint was stored empty.";

    internal const string RequiredControlStoredEmpty = "Required control was stored empty.";

    internal static string SectionNotStored(string itemPhrase) => $"{itemPhrase} section was not stored.";
}
