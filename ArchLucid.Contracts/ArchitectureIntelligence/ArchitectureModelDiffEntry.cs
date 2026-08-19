namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ArchitectureModelDiffEntry
{
    public string ElementId
    {
        get;
        set;
    } = string.Empty;

    public string ChangeKind
    {
        get;
        set;
    } = string.Empty;

    public ArchitectureElementKind ElementKind
    {
        get;
        set;
    }

    public string Description
    {
        get;
        set;
    } = string.Empty;
}
