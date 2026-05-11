using System.Net;
using System.Text;

namespace ArchLucid.TestSupport.Http;

/// <summary>Returns a fixed status and body for every request (no real network).</summary>
public sealed class FixedResponseHttpMessageHandler(HttpStatusCode statusCode, string? body, string mediaType = "application/json") : HttpMessageHandler
{
    private readonly string _body = body ?? string.Empty;

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
        Task.FromResult(
            new HttpResponseMessage(statusCode) { Content = new StringContent(_body, Encoding.UTF8, mediaType) });
}
