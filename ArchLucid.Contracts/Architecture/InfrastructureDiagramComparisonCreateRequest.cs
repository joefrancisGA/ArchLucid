using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Architecture;

public sealed class InfrastructureDiagramComparisonCreateRequest
{
    public Guid SnapshotId
    {
        get;
        set;
    }

    private List<DiagramSourceReference> sources = [];

    public List<DiagramSourceReference> Sources
    {
        get => sources;
        set => sources = ContractCollectionDefaults.Coalesce(value);
    }
}
