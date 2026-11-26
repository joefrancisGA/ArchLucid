using System.Net;
using ArchLucid.Cli;
using Xunit;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
public sealed class CliHttpClientFactoryTests
{
    [Fact]
    public void Default_client_preserves_platform_defaults_without_credentials()
    {
        using var client = CliHttpClientFactory.Create();
        Assert.Null(client.BaseAddress);
        Assert.Equal(TimeSpan.FromSeconds(100), client.Timeout);
        Assert.Empty(client.DefaultRequestHeaders);
    }

    [Fact]
    public void Explicit_timeout_and_base_address_are_preserved()
    {
        var address = new Uri("https://example.com/api/");
        using var client = CliHttpClientFactory.Create(TimeSpan.FromSeconds(20), address);
        Assert.Equal(address, client.BaseAddress);
        Assert.Equal(TimeSpan.FromSeconds(20), client.Timeout);
        Assert.Empty(client.DefaultRequestHeaders);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Custom_handler_and_ownership_are_preserved(bool ownsHandler)
    {
        using var handler = new TrackingHandler();
        using (var client = CliHttpClientFactory.Create(handler, ownsHandler, TimeSpan.FromSeconds(5), new Uri("https://example.com/")))
        {
            using var response = await client.GetAsync("probe");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(new Uri("https://example.com/probe"), handler.RequestUri);
        }
        Assert.Equal(ownsHandler, handler.Disposed);
    }

    private sealed class TrackingHandler : HttpMessageHandler
    {
        public bool Disposed { get; private set; }
        public Uri? RequestUri { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestUri = request.RequestUri;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing) Disposed = true;
            base.Dispose(disposing);
        }
    }
}
