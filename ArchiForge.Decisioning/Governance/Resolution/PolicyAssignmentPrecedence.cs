namespace ArchiForge.Decisioning.Governance.Resolution;

/// <summary>Explains how an assignment participated in precedence ordering.</summary>
public class PolicyAssignmentPrecedence
{
    public Guid AssignmentId
    {
        get; set;
    }
    public string ScopeLevel { get; set; } = default!;
    public int PrecedenceRank
    {
        get; set;
    }
    public bool IsPinned
    {
        get; set;
    }
    public DateTime AssignedUtc
    {
        get; set;
    }
}
