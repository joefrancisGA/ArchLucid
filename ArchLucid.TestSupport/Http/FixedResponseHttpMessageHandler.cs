using System.Net;
using System.Text;

namespace ArchLucid.TestSupport.Http;

/// <summary>Returns a fixed status and body for every request (no real network).</summary>
public sealed class FixedResponseHttpMessageHandler : HttpMessageHandler
{
    private readonly HttpStatusCode _statusCode;
    private readonly string _body;
    private readonly string _mediaType;

    public FixedResponseHttpMessageHandler(HttpStatusCode statusCode, string body, string mediaType = "application/json")
    {
        _statusCode = statusCode;
        _body = body ?? string.Empty;
        _mediaType = mediaType;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
        Task.FromResult(
            new HttpResponseMessage(_statusCode) { Content = new StringContent(_body, Encoding.UTF8, _mediaType) });
}
