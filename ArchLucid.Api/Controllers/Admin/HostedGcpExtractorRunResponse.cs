namespace ArchLucid.Api.Controllers.Admin;

public sealed class HostedGcpExtractorRunResponse
{
    public Guid PackageId { get; init; }

    public int ResourceCount { get; init; }
}
