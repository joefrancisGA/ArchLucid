namespace ArchLucid.Contracts.Findings.Payloads;

public class DeclarationPremiseConflictFindingPayload
{
    public string ConflictKind
    {
        get;
        set;
    } = null!;

    public string DeclarationPropertyKey
    {
        get;
        set;
    } = null!;

    public string DeclarationPropertyValue
    {
        get;
        set;
    } = null!;

    public string IntentNodeId
    {
        get;
        set;
    } = null!;

    public string IntentRequirementText
    {
        get;
        set;
    } = null!;

    public bool IsNarrowApplicability
    {
        get;
        set;
    }

    public string TopologyNodeId
    {
        get;
        set;
    } = null!;
}
