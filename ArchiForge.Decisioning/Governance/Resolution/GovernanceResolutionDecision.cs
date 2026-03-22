namespace ArchiForge.Decisioning.Governance.Resolution;

public class GovernanceResolutionDecision
{
    public string ItemType { get; set; } = default!;
    public string ItemKey { get; set; } = default!;

    public Guid WinningPolicyPackId { get; set; }
    public string WinningPolicyPackName { get; set; } = default!;
    public string WinningVersion { get; set; } = default!;

    public string WinningScopeLevel { get; set; } = default!;
    public string ResolutionReason { get; set; } = default!;

    public List<GovernanceResolutionCandidate> Candidates { get; set; } = [];
}
