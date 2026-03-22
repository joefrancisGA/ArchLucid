namespace ArchiForge.Decisioning.Governance.PolicyPacks;

public class EffectivePolicyPackSet
{
    public Guid TenantId { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid ProjectId { get; set; }

    public List<ResolvedPolicyPack> Packs { get; set; } = [];
}
