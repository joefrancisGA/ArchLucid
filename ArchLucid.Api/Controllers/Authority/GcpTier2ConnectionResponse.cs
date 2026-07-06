namespace ArchLucid.Api.Controllers.Authority;

public sealed class GcpTier2ConnectionResponse
{
    public Guid ConnectionId { get; init; }

    public required string ProjectId { get; init; }

    public required string WorkloadIdentityPoolProvider { get; init; }

    public required string ServiceAccountEmail { get; init; }

    public required string Status { get; init; }

    public DateTimeOffset? LastPolledUtc { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }
}
