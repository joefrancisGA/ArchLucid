namespace ArchLucid.Contracts.InfraEvidence;

public sealed class SecurityEvidenceCutPointSummaryResponse
{
    public Guid CutPointId
    {
        get;
        init;
    }

    public int CutOrder
    {
        get;
        init;
    }

    public string CutKind
    {
        get;
        init;
    } = string.Empty;

    public string? FromNodeLabel
    {
        get;
        init;
    }

    public string? ToNodeLabel
    {
        get;
        init;
    }

    public string? EdgeType
    {
        get;
        init;
    }

    public int PathsCollapsedCount
    {
        get;
        init;
    }

    public string OperationalCostClass
    {
        get;
        init;
    } = string.Empty;

    public decimal LeverageScore
    {
        get;
        init;
    }

    public IReadOnlyList<Guid> CollapsedPathIds
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> EvidenceReferences
    {
        get;
        init;
    } = [];

    public string? SuggestedPatternKey
    {
        get;
        init;
    }

    public string ExplanationSummary
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SecurityEvidencePathRankedPageResponse
{
    public IReadOnlyList<SecurityEvidencePathRankSummaryResponse> Items
    {
        get;
        init;
    } = [];

    public int TotalCount
    {
        get;
        init;
    }

    public int Page
    {
        get;
        init;
    }

    public int PageSize
    {
        get;
        init;
    }

    public IReadOnlyList<SecurityEvidenceCutPointSummaryResponse> TopCutPoints
    {
        get;
        init;
    } = [];
}
