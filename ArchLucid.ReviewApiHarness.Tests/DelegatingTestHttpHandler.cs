namespace ArchLucid.ReviewApiHarness.Tests;

/// <summary>Test double that delegates <see cref="HttpMessageHandler.SendAsync"/> to a supplied function.</summary>
internal sealed class DelegatingTestHttpHandler(
    Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler)
    : HttpMessageHandler
{
    private readonly Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> _handler =
        handler ?? throw new ArgumentNullException(nameof(handler));

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        return _handler(request, cancellationToken);
    }
}
