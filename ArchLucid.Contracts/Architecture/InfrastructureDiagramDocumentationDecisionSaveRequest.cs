namespace ArchLucid.Contracts.Architecture;

public sealed class InfrastructureDiagramDocumentationDecisionSaveRequest
{
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
}
