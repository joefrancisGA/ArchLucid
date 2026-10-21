using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Persistence.Governance;

/// <summary>Concrete list wrapper so HybridCache can round-trip version rows.</summary>
public sealed class CachedPolicyPackVersionList
{
    public List<PolicyPackVersion> Items
    {
        get;
        init;
    } = [];
}
