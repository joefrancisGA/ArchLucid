namespace ArchiForge.Decisioning.Models;

public class DecisionTrace
{
    public Guid TenantId { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid DecisionTraceId { get; set; }
    public Guid RunId { get; set; }
    public DateTime CreatedUtc { get; set; }
    public string RuleSetId { get; set; } = string.Empty;
    public string RuleSetVersion { get; set; } = string.Empty;
    public string RuleSetHash { get; set; } = string.Empty;
    public List<string> AppliedRuleIds { get; set; } = [];
    public List<string> AcceptedFindingIds { get; set; } = [];
    public List<string> RejectedFindingIds { get; set; } = [];
    public List<string> Notes { get; set; } = [];
}

