namespace ArchLucid.TestSupport.Http;

/// <summary>Simulates transport-layer failures (timeouts, DNS, TLS) for outbound connector conformance tests.</summary>
public sealed class FaultingHttpMessageHandler(Exception exception) : HttpMessageHandler
{
    private readonly Exception _exception = exception ?? throw new ArgumentNullException(nameof(exception));

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
        Task.FromException<HttpResponseMessage>(_exception);
}
