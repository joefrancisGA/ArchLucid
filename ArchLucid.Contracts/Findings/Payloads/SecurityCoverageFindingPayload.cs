using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings.Payloads;

public class SecurityCoverageFindingPayload
{
    public int SecurityNodeCount
    {
        get;
        set;
    }

    public int ProtectedResourceCount
    {
        get;
        set;
    }

    public int UnprotectedResourceCount
    {
        get;
        set;
    }

    private List<string> unprotectedResources = [];

    public List<string> UnprotectedResources
    {
        get => unprotectedResources;
        set => unprotectedResources = ContractCollectionDefaults.Coalesce(value);
    }
}
