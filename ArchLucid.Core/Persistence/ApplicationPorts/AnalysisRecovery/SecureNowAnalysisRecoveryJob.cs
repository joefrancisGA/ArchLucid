using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

public sealed class SecureNowAnalysisRecoveryJob
{
    public Guid TenantId { get; init; }
    public Guid WorkspaceId { get; init; }
    public Guid ProjectId { get; init; }
    public Guid SnapshotId { get; init; }
    public string? SubscriptionId { get; init; }
    public bool FullRecompute { get; init; }
    public string InputVersion { get; init; } = string.Empty;
    public DateTime AdmittedUtc { get; init; }
    public DateTime DeadlineUtc { get; init; }
    public string? Outcome { get; init; }

    public ScopeContext CreateScope() => new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };
}
