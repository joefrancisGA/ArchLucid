namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ChangeImpactItem
{
    public string ElementId
    {
        get;
        set;
    } = null!;

    public string ImpactKind
    {
        get;
        set;
    } = null!;

    public string Description
    {
        get;
        set;
    } = null!;

    public ChangeImpactCategory Category
    {
        get;
        set;
    } = ChangeImpactCategory.RelatedElement;
}
