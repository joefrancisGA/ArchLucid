namespace ArchLucid.Api.Controllers.Authority;

public sealed class AwsTier2ConnectionConfigureBody
{
    public required string AccountId { get; init; }

    public required string Region { get; init; }

    public required string RoleArn { get; init; }
}
