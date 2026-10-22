using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings.Payloads;

public class RequirementCoverageFindingPayload
{
    public int RequirementNodeCount
    {
        get;
        set;
    }

    public int CoveredRequirementCount
    {
        get;
        set;
    }

    public int UncoveredRequirementCount
    {
        get;
        set;
    }

    private List<string> uncoveredRequirements = [];

    public List<string> UncoveredRequirements
    {
        get => uncoveredRequirements;
        set => uncoveredRequirements = ContractCollectionDefaults.Coalesce(value);
    }
}
