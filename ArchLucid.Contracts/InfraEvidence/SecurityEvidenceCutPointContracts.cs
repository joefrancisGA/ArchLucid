using ArchLucid.Contracts.Serialization;

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

    private IReadOnlyList<Guid> collapsedPathIds = [];

    public IReadOnlyList<Guid> CollapsedPathIds
    {
        get => collapsedPathIds;
        init => collapsedPathIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> evidenceReferences = [];

    public IReadOnlyList<string> EvidenceReferences
    {
        get => evidenceReferences;
        init => evidenceReferences = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

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
    private IReadOnlyList<SecurityEvidencePathRankSummaryResponse> items = [];

    public IReadOnlyList<SecurityEvidencePathRankSummaryResponse> Items
    {
        get => items;
        init => items = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

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

    private IReadOnlyList<SecurityEvidenceCutPointSummaryResponse> topCutPoints = [];

    public IReadOnlyList<SecurityEvidenceCutPointSummaryResponse> TopCutPoints
    {
        get => topCutPoints;
        init => topCutPoints = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
