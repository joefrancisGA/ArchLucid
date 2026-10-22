using ArchLucid.Core.Persistence.ApplicationPorts.Coordination;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>Row from <c>dbo.CosmosGraphSnapshotOutbox</c> pending Cosmos replication.</summary>
public sealed class CosmosGraphSnapshotOutboxEntry : IRecoverableOutboxEntry
{
    public Guid OutboxId { get; init; }

    public Guid GraphSnapshotId { get; init; }

    public Guid RunId { get; init; }

    public Guid TenantId { get; init; }

    public Guid WorkspaceId { get; init; }

    public Guid ProjectId { get; init; }

    public DateTime CreatedUtc { get; init; }

    public int AttemptCount { get; init; }

    public DateTime? LockedUntilUtc { get; init; }

    public DateTime? NextAttemptUtc { get; init; }

    public string? LastAttemptError { get; init; }

    public DateTime? DeadLetteredUtc { get; init; }
}
