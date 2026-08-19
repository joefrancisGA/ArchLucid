namespace ArchLucid.Contracts.Findings.Payloads;

public class SecurityBaselineExpectationFindingPayload
{
    public int TopologyNodeCount
    {
        get;
        set;
    }

    public int SecurityNodeCount
    {
        get;
        set;
    }

    public List<string> ExpectedCategories
    {
        get;
        set;
    } = [];

    public List<string> ProtectedCategories
    {
        get;
        set;
    } = [];

    public List<string> MissingCategories
    {
        get;
        set;
    } = [];
}
