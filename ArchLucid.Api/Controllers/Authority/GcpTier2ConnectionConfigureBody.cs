namespace ArchLucid.Api.Controllers.Authority;

public sealed class GcpTier2ConnectionConfigureBody
{
    public required string ProjectId { get; init; }

    public required string WorkloadIdentityPoolProvider { get; init; }

    public required string ServiceAccountEmail { get; init; }
}
