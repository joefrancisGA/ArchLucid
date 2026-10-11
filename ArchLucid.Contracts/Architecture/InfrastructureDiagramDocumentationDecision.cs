namespace ArchLucid.Contracts.Architecture;

public sealed class InfrastructureDiagramDocumentationDecision
{
    public Guid ScopeId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public string SubjectKind
    {
        get;
        init;
    } = string.Empty;

    public string SubjectKey
    {
        get;
        init;
    } = string.Empty;

    public string Decision
    {
        get;
        init;
    } = string.Empty;

    public string CarryForwardState
    {
        get;
        init;
    } = string.Empty;

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
