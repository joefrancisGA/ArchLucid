namespace ArchLucid.Api.Controllers.Admin;

public sealed class HostedGcpExtractorRunBody
{
    public Guid ConnectionId { get; init; }

    public Guid? RunId { get; init; }
}
