namespace ArchLucid.Api.Controllers.Admin;

public sealed class HostedAwsExtractorRunResponse
{
    public Guid PackageId { get; init; }

    public int ResourceCount { get; init; }
}
