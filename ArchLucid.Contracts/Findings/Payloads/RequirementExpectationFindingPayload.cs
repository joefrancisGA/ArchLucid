using ArchLucid.Contracts.Serialization;

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

    private List<string> expectedThemes = [];

    public List<string> ExpectedThemes
    {
        get => expectedThemes;
        set => expectedThemes = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> presentThemes = [];

    public List<string> PresentThemes
    {
        get => presentThemes;
        set => presentThemes = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> missingThemes = [];

    public List<string> MissingThemes
    {
        get => missingThemes;
        set => missingThemes = ContractCollectionDefaults.Coalesce(value);
    }
}
