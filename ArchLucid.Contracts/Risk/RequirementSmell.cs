using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Risk;

public sealed class RequirementSmell
{
    private string requirementId = string.Empty;

    public string RequirementId
    {
        get => requirementId;
        set => requirementId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    public RequirementSmellKind Kind
    {
        get;
        set;
    }

    private string rationale = string.Empty;

    public string Rationale
    {
        get => rationale;
        set => rationale = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private List<string> evidenceRefs = [];

    public List<string> EvidenceRefs
    {
        get => evidenceRefs;
        set => evidenceRefs = ContractCollectionDefaults.Coalesce(value);
    }
}