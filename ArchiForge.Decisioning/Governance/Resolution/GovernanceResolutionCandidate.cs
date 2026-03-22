namespace ArchiForge.Decisioning.Governance.Resolution;

public class GovernanceResolutionCandidate
{
    public Guid PolicyPackId { get; set; }
    public string PolicyPackName { get; set; } = default!;
    public string Version { get; set; } = default!;
    public string ScopeLevel { get; set; } = default!;
    public int PrecedenceRank { get; set; }
    public bool WasSelected { get; set; }
    public string ValueJson { get; set; } = default!;

    public Guid AssignmentId { get; set; }
    public DateTime AssignedUtc { get; set; }
}
