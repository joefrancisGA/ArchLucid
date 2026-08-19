namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>One entry in <see cref="EffectivePolicyPackSet.Packs" /> after assignment + version resolution.</summary>
public class ResolvedPolicyPack
{
    public Guid PolicyPackId
    {
        get;
        set;
    }

    public string Name
    {
        get;
        set;
    } = null!;

    public string Version
    {
        get;
        set;
    } = null!;

    public string PackType
    {
        get;
        set;
    } = null!;

    public string ContentJson
    {
        get;
        set;
    } = null!;
}
