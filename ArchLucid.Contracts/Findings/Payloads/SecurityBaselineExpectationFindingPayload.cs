using ArchLucid.Contracts.Serialization;

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

    private List<string> expectedCategories = [];

    public List<string> ExpectedCategories
    {
        get => expectedCategories;
        set => expectedCategories = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> protectedCategories = [];

    public List<string> ProtectedCategories
    {
        get => protectedCategories;
        set => protectedCategories = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> missingCategories = [];

    public List<string> MissingCategories
    {
        get => missingCategories;
        set => missingCategories = ContractCollectionDefaults.Coalesce(value);
    }
}
