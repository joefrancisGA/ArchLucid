using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDiffNarrativeRecord
{
    public Guid NarrativeId
    {
        get;
        init;
    }

    public Guid DiffId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public AzureInventoryDiffNarrativeKind NarrativeKind
    {
        get;
        init;
    }

    public string NarrativeText
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<Guid> CitedChangeIds
    {
        get;
        init;
    } = [];

    public ProvenanceKind ProvenanceKind
    {
        get;
        init;
    }

    public string? SimulatorLabel
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}

public sealed class AzureInventoryDiffExecutiveSummaryRecord
{
    public Guid DiffId
    {
        get;
        init;
    }

    public int TotalChanges
    {
        get;
        init;
    }

    public int SecurityRelevantCount
    {
        get;
        init;
    }

    public int ArchitectureRelevantCount
    {
        get;
        init;
    }

    public int PotentiallyDangerousCount
    {
        get;
        init;
    }

    public int UnapprovedCount
    {
        get;
        init;
    }

    public string Headline
    {
        get;
        init;
    } = string.Empty;
}
