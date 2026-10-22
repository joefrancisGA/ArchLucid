using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SecurityEvidenceCutPointRecord
{
    public Guid CutPointId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public string RuleVersion
    {
        get;
        init;
    } = string.Empty;

    public SecurityEvidenceCutPointKind CutKind
    {
        get;
        init;
    }

    public string CutKey
    {
        get;
        init;
    } = string.Empty;

    public string? FromNodeId
    {
        get;
        init;
    }

    public string? ToNodeId
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

    public SecurityEvidenceCutPointOperationalCostClass OperationalCostClass
    {
        get;
        init;
    }

    public decimal LeverageScore
    {
        get;
        init;
    }

    public int CutOrder
    {
        get;
        init;
    }

    public string EvidenceReferencesJson
    {
        get;
        init;
    } = string.Empty;

    public string CollapsedPathIdsJson
    {
        get;
        init;
    } = string.Empty;

    public string? SuggestedPatternKey
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string? ResourceType
    {
        get;
        init;
    }

    public DateTime ComputedUtc
    {
        get;
        init;
    }
}
