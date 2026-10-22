namespace ArchLucid.Decisioning.Analysis;

public sealed class SecurityBaselineCategoryExpectationResult
{
    public int TopologyNodeCount
    {
        get;
        init;
    }

    public int SecurityNodeCount
    {
        get;
        init;
    }

    public List<string> ExpectedCategories
    {
        get;
        init;
    } = [];

    public List<string> ProtectedCategories
    {
        get;
        init;
    } = [];

    public List<string> MissingCategories
    {
        get;
        init;
    } = [];
}
