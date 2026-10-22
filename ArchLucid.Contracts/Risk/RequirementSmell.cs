using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Risk;

public sealed class RequirementSmell
{
    public string RequirementId
    {
        get;
        set;
    } = null!;

    public RequirementSmellKind Kind
    {
        get;
        set;
    }

    public string Rationale
    {
        get;
        set;
    } = null!;

    private List<string> evidenceRefs = [];

    public List<string> EvidenceRefs
    {
        get => evidenceRefs;
        set => evidenceRefs = ContractCollectionDefaults.Coalesce(value);
    }
}
