namespace ArchLucid.Core.GcpExtractor;

public sealed class TenantGcpConnectionRecord
{
    public Guid ConnectionId { get; init; }

    public Guid TenantId { get; init; }

    public required string ProjectId { get; init; }

    public required string WorkloadIdentityPoolProvider { get; init; }

    public required string ServiceAccountEmail { get; init; }

    public GcpConnectionStatus Status { get; init; }

    public DateTimeOffset? LastPolledUtc { get; init; }

    public DateTimeOffset CreatedUtc { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }

    public required string UpdatedByActorId { get; init; }
}
