using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidCollapseReport
{
    private List<InfraEvidenceMermaidCollapseEntry> entries = [];

    public List<InfraEvidenceMermaidCollapseEntry> Entries
    {
        get => entries;
        set => entries = ContractCollectionDefaults.Coalesce(value);
    }
}
