namespace ArchLucid.Api.Tests.Integrations;

/// <summary>
///     Routes outbound vendor HTTP from typed clients (<see cref="ArchLucid.Application.Integrations.Itsm.Outbound.JiraOutboundIssueClient" />,
///     <see cref="ArchLucid.Application.Integrations.Itsm.Outbound.ServiceNowOutboundIncidentClient" />) to test-controlled responses.
/// </summary>
public sealed class RecordingOutboundHttpHandler : HttpMessageHandler
{
    /// <summary>When null, returns <see cref="System.Net.HttpStatusCode.NotFound" />.</summary>
    public Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>>? RespondAsync
    {
        get;
        set;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        return RespondAsync is null ? Task.FromResult(new HttpResponseMessage(System.Net.HttpStatusCode.NotFound)) : RespondAsync(request, cancellationToken);
    }
}
