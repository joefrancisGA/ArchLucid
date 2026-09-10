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

    /// <summary>
    ///     Optional provenance discriminator (e.g. <c>prose-assumption</c> for DX-55). Null or empty for
    ///     declaration-driven conflicts.
    /// </summary>
    public string? Source
    {
        get;
        set;
    }
}
