namespace ArchLucid.Decisioning.Analysis;

public sealed class RequirementExpectationResult
{
    public int RequirementNodeCount
    {
        get;
        init;
    }

    public int TopologyNodeCount
    {
        get;
        init;
    }

    public List<string> ExpectedThemes
    {
        get;
        init;
    } = [];

    public List<string> PresentThemes
    {
        get;
        init;
    } = [];

    public List<string> MissingThemes
    {
        get;
        init;
    } = [];
}
