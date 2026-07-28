namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ExtractionFidelityCase
{
    public string CaseId
    {
        get;
        set;
    } = null!;

    public string SourceText
    {
        get;
        set;
    } = null!;

    public List<ArchitectureElementKind> ExpectedElementKinds
    {
        get;
        set;
    } = [];

    public List<string> ExpectedNames
    {
        get;
        set;
    } = [];
}
