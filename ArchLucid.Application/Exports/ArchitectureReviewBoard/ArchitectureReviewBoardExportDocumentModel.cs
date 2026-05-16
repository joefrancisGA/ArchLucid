namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>
///     Input snapshot for <see cref="ArchitectureReviewDocxBuilder" /> — populated from a finalized review (committed run),
///     manifests, findings, and governance artifacts.
/// </summary>
public sealed class ArchitectureReviewBoardExportDocumentModel
{
    public Guid ReviewId
    {
        get;
        init;
    }

    public string RunId
    {
        get;
        init;
    } = string.Empty;

    public string? RequestId
    {
        get;
        init;
    }

    public string? SystemName
    {
        get;
        init;
    }

    /// <summary>Architecture snapshot / manifest version label.</summary>
    public string? ManifestVersion
    {
        get;
        init;
    }

    /// <summary>Optional narrative from review metadata or AI-assisted summary.</summary>
    public string? ExecutiveSummary
    {
        get;
        init;
    }

    public IReadOnlyList<string> SystemOverviewBullets
    {
        get;
        init;
    } = [];

    public IReadOnlyList<ArchitectureReviewBoardExportEvidenceItem> EvidenceReviewed
    {
        get;
        init;
    } = [];

    public IReadOnlyList<ArchitectureReviewBoardExportDecisionRow> ArchitectureDecisions
    {
        get;
        init;
    } = [];

    public IReadOnlyList<ArchitectureReviewBoardExportRiskRow> KeyRisks
    {
        get;
        init;
    } = [];

    public IReadOnlyList<ArchitectureReviewBoardExportPolicyFindingRow> PolicyFindings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<ArchitectureReviewBoardExportDispositionItem> AiDispositionFindings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<ArchitectureReviewBoardExportTraceRow> TraceabilityLines
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> RecommendedNextActions
    {
        get;
        init;
    } = [];

    public string? HttpCorrelationId
    {
        get;
        init;
    }

    public string? ExtractorTimestampUtcLabel
    {
        get;
        init;
    }
}
