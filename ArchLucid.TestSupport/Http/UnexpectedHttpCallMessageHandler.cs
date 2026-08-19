namespace ArchLucid.TestSupport.Http;

/// <summary>Fails fast when an HTTP call was not expected (mis-wired HttpClient dependency graph).</summary>
public sealed class UnexpectedHttpCallMessageHandler : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
        Task.FromException<HttpResponseMessage>(new InvalidOperationException("Unexpected HTTP call."));
}
