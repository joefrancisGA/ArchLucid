namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ArchitectureIntelligenceDeepCase
{
    public string CaseId
    {
        get;
        set;
    } = string.Empty;

    public string Title
    {
        get;
        set;
    } = string.Empty;

    public string SourceText
    {
        get;
        set;
    } = string.Empty;

    public List<PlantedDefectExpectation> PlantedDefects
    {
        get;
        set;
    } = [];

    public List<string> ExpectedMutationIds
    {
        get;
        set;
    } = [];
}
