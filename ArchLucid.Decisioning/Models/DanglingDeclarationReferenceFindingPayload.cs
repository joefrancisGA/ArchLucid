namespace ArchLucid.Decisioning.Models;

public sealed class DanglingDeclarationReferenceFindingPayload
{
    public string SourceNodeId
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
