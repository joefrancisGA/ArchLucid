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

    public List<string> EvidenceRefs
    {
        get;
        set;
    } = [];
}
