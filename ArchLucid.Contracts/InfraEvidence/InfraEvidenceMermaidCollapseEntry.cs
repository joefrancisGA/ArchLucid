namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidCollapseEntry
{
    public string Kind
    {
        get;
        set;
    } = string.Empty;

    public Guid? CloudResourceId
    {
        get;
        set;
    }

    public string? NodeId
    {
        get;
        set;
    }

    public string Reason
    {
        get;
        set;
    } = string.Empty;
}
