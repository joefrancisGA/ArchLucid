using System.Net;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureOpenAiBootstrapConnectivityProbeTests
{
    [Fact]
    public async Task Probe_succeeds_on_2xx()
    {
        HttpClient client = CreateClient(
            (request, _) =>
            {
                request.RequestUri.Should().NotBeNull();
                request.RequestUri!.AbsolutePath.Should().Contain("openai");
                request.Headers.GetValues("api-key").Should().ContainSingle().Which.Should().Be("abc");

                return new HttpResponseMessage(HttpStatusCode.OK);
            });

        AzureOpenAiBootstrapProbeResult result = await AzureOpenAiBootstrapConnectivityProbe.ProbeAsync(
            client,
            "https://x.openai.azure.com",
            "abc");

        result.Succeeded.Should().BeTrue();
        result.HttpStatusCode.Should().Be(200);
    }

    [Fact]
    public async Task Probe_fails_on_401()
    {
        HttpClient client = CreateClient(
            (_, _) => new HttpResponseMessage(HttpStatusCode.Unauthorized));

        AzureOpenAiBootstrapProbeResult result = await AzureOpenAiBootstrapConnectivityProbe.ProbeAsync(
            client,
            "https://x.openai.azure.com/",
            "bad-key");

        result.Succeeded.Should().BeFalse();
        result.HttpStatusCode.Should().Be(401);
        result.Error.Should().Contain("401");
    }

    [Fact]
    public async Task Probe_fails_when_http_endpoint()
    {
        HttpClient client = CreateClient(
            (_, _) => new HttpResponseMessage(HttpStatusCode.OK));

        AzureOpenAiBootstrapProbeResult result = await AzureOpenAiBootstrapConnectivityProbe.ProbeAsync(
            client,
            "http://x.openai.azure.com/",
            "k");

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Contain("HTTPS");
    }

    private static HttpClient CreateClient(Func<HttpRequestMessage, CancellationToken, HttpResponseMessage> send)
    {
        return new HttpClient(
            new DelegateHandler(send))
        {
            Timeout = TimeSpan.FromSeconds(5),
        };
    }

    private sealed class DelegateHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, HttpResponseMessage> _send;

        internal DelegateHandler(Func<HttpRequestMessage, CancellationToken, HttpResponseMessage> send)
        {
            _send = send;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(_send(request, cancellationToken));
    }
}
