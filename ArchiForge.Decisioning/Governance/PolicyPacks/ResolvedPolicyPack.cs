namespace ArchiForge.Decisioning.Governance.PolicyPacks;

public class ResolvedPolicyPack
{
    public Guid PolicyPackId { get; set; }
    public string Name { get; set; } = default!;
    public string Version { get; set; } = default!;
    public string PackType { get; set; } = default!;
    public string ContentJson { get; set; } = default!;
}
