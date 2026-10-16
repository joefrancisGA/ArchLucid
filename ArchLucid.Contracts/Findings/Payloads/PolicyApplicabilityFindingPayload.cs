using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings.Payloads;

public class PolicyApplicabilityFindingPayload
{
    public string PolicyName
    {
        get;
        set;
    } = "";

    public string? PolicyReference
    {
        get;
        set;
    }

    public int ApplicableTopologyResourceCount
    {
        get;
        set;
    }

    private List<string> applicableTopologyNodeIds = [];

    public List<string> ApplicableTopologyNodeIds
    {
        get => applicableTopologyNodeIds;
        set => applicableTopologyNodeIds = ContractCollectionDefaults.Coalesce(value);
    }
}
