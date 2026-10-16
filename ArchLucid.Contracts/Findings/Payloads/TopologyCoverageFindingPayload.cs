using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings.Payloads;

public class TopologyCoverageFindingPayload
{
    public int TopologyNodeCount
    {
        get;
        set;
    }

    private List<string> presentCategories = [];

    public List<string> PresentCategories
    {
        get => presentCategories;
        set => presentCategories = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> missingCategories = [];

    public List<string> MissingCategories
    {
        get => missingCategories;
        set => missingCategories = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> expectedCategories = [];

    public List<string> ExpectedCategories
    {
        get => expectedCategories;
        set => expectedCategories = ContractCollectionDefaults.Coalesce(value);
    }
}
