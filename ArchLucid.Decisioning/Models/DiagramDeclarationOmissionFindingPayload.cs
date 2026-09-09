namespace ArchLucid.Decisioning.Models;

public sealed class DiagramDeclarationOmissionFindingPayload
{
    public string DiagramParticipantNodeId
    {
        get;
        set;
    } = null!;

    public string OmittedDeclarationNodeId
    {
        get;
        set;
    } = null!;

    public string PropertyName
    {
        get;
        set;
    } = null!;

    public string ReferencedToken
    {
        get;
        set;
    } = null!;

    public string ReferenceKind
    {
        get;
        set;
    } = null!;
}
