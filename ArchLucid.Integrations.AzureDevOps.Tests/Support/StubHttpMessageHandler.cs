using System.Net;

namespace ArchLucid.Integrations.AzureDevOps.Tests.Support;

/// <summary>Records outbound requests and returns a canned response, or throws to simulate a transport failure.</summary>
internal sealed class StubHttpMessageHandler(
    HttpStatusCode statusCode = HttpStatusCode.OK,
    string responseBody = "",
    Exception? throwOnSend = null) : HttpMessageHandler
{
    private readonly List<CapturedHttpRequest> _requests = [];

    internal IReadOnlyList<CapturedHttpRequest> Requests => _requests;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        string? body = null;

        if (request.Content is not null)
            body = await request.Content.ReadAsStringAsync(cancellationToken);

        _requests.Add(new CapturedHttpRequest(
            request.Method,
            request.RequestUri,
            request.Headers.Authorization?.Scheme,
            request.Headers.Authorization?.Parameter,
            body));

        // Recorded before throwing so a failure test can still assert the attempt was made.

        if (throwOnSend is not null)
            throw throwOnSend;

        return new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(responseBody),
        };
    }
}
