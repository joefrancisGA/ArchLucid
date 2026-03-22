using ArchiForge.Decisioning.Governance.Resolution;

namespace ArchiForge.Decisioning.Governance.PolicyPacks;

public class PolicyPackAssignment
{
    public Guid AssignmentId { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid ProjectId { get; set; }

    public Guid PolicyPackId { get; set; }
    public string PolicyPackVersion { get; set; } = null!;

    public bool IsEnabled { get; set; } = true;

    /// <summary>Tenant, Workspace, or Project — see <see cref="GovernanceScopeLevel"/>.</summary>
    public string ScopeLevel { get; set; } = GovernanceScopeLevel.Project;

    public bool IsPinned { get; set; }

    public DateTime AssignedUtc { get; set; } = DateTime.UtcNow;
}
