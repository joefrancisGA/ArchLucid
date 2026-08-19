namespace ArchLucid.Api.Controllers.Authority;

public sealed class AwsTier2ConnectionResponse
{
    public Guid ConnectionId { get; init; }

    public required string AccountId { get; init; }

    public required string Region { get; init; }

    public required string RoleArn { get; init; }

    public required string Status { get; init; }

    public DateTimeOffset? LastPolledUtc { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }
}
