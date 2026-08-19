namespace ArchLucid.Api.Controllers.Admin;

public sealed class HostedAwsExtractorRunBody
{
    public Guid ConnectionId { get; init; }

    public Guid? RunId { get; init; }
}
