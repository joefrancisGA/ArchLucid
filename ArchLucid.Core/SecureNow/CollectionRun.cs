namespace ArchLucid.Core.SecureNow;

public sealed record CollectionRun
{
    public Guid TenantId { get; init; }
    public Guid WorkspaceId { get; init; }
    public Guid ProjectId { get; init; }
    public Guid RunId { get; init; }
    public string AgentVersion { get; init; } = string.Empty;
    public string? Schedule { get; init; }
    public DateTime StartedUtc { get; init; }
    public DateTime? FinishedUtc { get; init; }
    public CollectionRunStatus Status { get; init; }
    public string SubscriptionsCoveredJson { get; init; } = "[]";
    public string? ErrorSummary { get; init; }
    public string? ZipPath { get; init; }
    public byte[]? ZipSha256 { get; init; }
    public Guid? ImportedSnapshotId { get; init; }
}
