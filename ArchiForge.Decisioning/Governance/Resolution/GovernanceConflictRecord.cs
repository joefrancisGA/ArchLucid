namespace ArchiForge.Decisioning.Governance.Resolution;

public class GovernanceConflictRecord
{
    public string ItemType { get; set; } = default!;
    public string ItemKey { get; set; } = default!;

    public string ConflictType { get; set; } = default!;
    public string Description { get; set; } = default!;

    public List<GovernanceResolutionCandidate> Candidates { get; set; } = [];
}
