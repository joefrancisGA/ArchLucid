namespace ArchLucid.TestSupport.Http;

/// <summary>Records the last outbound request and optional body for provider conformance assertions.</summary>
public sealed class RecordingHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, HttpResponseMessage> _responder = responder ?? throw new ArgumentNullException(nameof(responder));

    public RecordingHttpMessageHandler(HttpResponseMessage fixedResponse)
        : this(_ => fixedResponse)
    {
    }

    public HttpRequestMessage? LastRequest
    {
        get; private set;
    }

    public string? LastRequestBody
    {
        get; private set;
    }

    public int RequestCount
    {
        get; private set;
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        RequestCount++;
        LastRequest = request;
        LastRequestBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);

        return _responder(request);
    }
}
