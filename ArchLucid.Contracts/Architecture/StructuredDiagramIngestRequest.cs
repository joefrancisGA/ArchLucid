using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Architecture;

public sealed class StructuredDiagramIngestRequest
{
    private IReadOnlyList<DiagramSourceReference> sources = [];

    public IReadOnlyList<DiagramSourceReference> Sources
    {
        get => sources;
        init => sources = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
