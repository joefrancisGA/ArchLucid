namespace ArchiForge.Application.Analysis;

public sealed class ConsultingDocxTemplateOptions
{
    public string OrganizationName { get; set; } = "ArchiForge";

    public string DocumentTitle { get; set; } = "Architecture Analysis Report";

    public string SubtitleFormat { get; set; } = "{SystemName}";

    public string GeneratedByLine { get; set; } = "Prepared by ArchiForge";

    public string PrimaryColorHex { get; set; } = "2E4053";

    public string SecondaryColorHex { get; set; } = "4F81BD";

    public string AccentFillHex { get; set; } = "EAF2F8";

    public string BodyColorHex { get; set; } = "1F1F1F";

    public string SubtleColorHex { get; set; } = "666666";

    public bool IncludeDocumentControl { get; set; } = true;

    public bool IncludeTableOfContents { get; set; } = true;

    public bool IncludeExecutiveSummary { get; set; } = true;

    public bool IncludeArchitectureOverview { get; set; } = true;

    public bool IncludeEvidenceAndConstraints { get; set; } = true;

    public bool IncludeArchitectureDetails { get; set; } = true;

    public bool IncludeGovernanceAndControls { get; set; } = true;

    public bool IncludeExplainabilitySection { get; set; } = true;

    public bool IncludeConclusions { get; set; } = true;

    public bool IncludeAppendixMermaid { get; set; } = true;

    public bool IncludeAppendixExecutionTraceIndex { get; set; } = true;

    public bool IncludeAppendixDeterminismAndComparison { get; set; } = true;

    public bool IncludeLogo { get; set; } = false;

    public string? LogoPath { get; set; }

    public string ExecutiveSummaryTextTemplate { get; set; } =
        "{SystemName} was analyzed by {OrganizationName} and resolved into an architecture containing {ServiceCount} service(s), {DatastoreCount} datastore(s), and {ControlCount} required control(s).";

    public string ArchitectureOverviewIntro { get; set; } =
        "The following section summarizes the resolved architecture and presents the primary runtime view.";

    public string ConclusionsText { get; set; } =
        "The architecture analysis produced a resolved manifest and supporting explainability artifacts suitable for technical review.";
}

