namespace ArchLucid.Contracts.Findings.Payloads;

public class RequirementExpectationFindingPayload
{
    public int RequirementNodeCount
    {
        get;
        set;
    }

    public int TopologyNodeCount
    {
        get;
        set;
    }

    public List<string> ExpectedThemes
    {
        get;
        set;
    } = [];

    public List<string> PresentThemes
    {
        get;
        set;
    } = [];

    public List<string> MissingThemes
    {
        get;
        set;
    } = [];
}
