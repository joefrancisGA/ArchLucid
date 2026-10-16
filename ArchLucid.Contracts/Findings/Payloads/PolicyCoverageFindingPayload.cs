using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings.Payloads;

public class PolicyCoverageFindingPayload
{
    public int PolicyNodeCount
    {
        get;
        set;
    }

    public int PolicyApplicabilityEdgeCount
    {
        get;
        set;
    }

    private List<string> uncoveredResources = [];

    public List<string> UncoveredResources
    {
        get => uncoveredResources;
        set => uncoveredResources = ContractCollectionDefaults.Coalesce(value);
    }
}
