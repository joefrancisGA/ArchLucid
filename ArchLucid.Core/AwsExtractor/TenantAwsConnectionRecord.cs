namespace ArchLucid.Core.AwsExtractor;

public sealed class TenantAwsConnectionRecord
{
    public Guid ConnectionId { get; init; }

    public Guid TenantId { get; init; }

    public required string AccountId { get; init; }

    public required string Region { get; init; }

    public required string RoleArn { get; init; }

    public AwsConnectionStatus Status { get; init; }

    public DateTimeOffset? LastPolledUtc { get; init; }

    public DateTimeOffset CreatedUtc { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }

    public required string UpdatedByActorId { get; init; }
}
