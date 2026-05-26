using System.Net;

using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Category", "Unit")]
public sealed class OidcAuthorityStartupProbeHostedServiceTests
{
    [Fact]
    public async Task StartAsync_when_fail_closed_and_probe_fails_stops_application()
    {
        CountingHostApplicationLifetime lifetime = new();
        StubHttpClientFactory factory = new(new StubHttpMessageHandler(HttpStatusCode.ServiceUnavailable));

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "JwtBearer",
                ["ArchLucidAuth:Authority"] = "https://login.example.com/tenant/v2.0",
                ["ArchLucidAuth:FailClosedOnOidcDiscoveryError"] = "true",
            })
            .Build();

        OidcAuthorityStartupProbeHostedService sut = new(
            configuration,
            factory,
            lifetime,
            NullLogger<OidcAuthorityStartupProbeHostedService>.Instance);

        await sut.StartAsync(CancellationToken.None);

        lifetime.StopApplicationCallCount.Should().Be(1);
    }

    [Fact]
    public async Task StartAsync_when_fail_closed_disabled_does_not_stop_application()
    {
        CountingHostApplicationLifetime lifetime = new();
        StubHttpClientFactory factory = new(new StubHttpMessageHandler(HttpStatusCode.ServiceUnavailable));

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArchLucidAuth:Mode"] = "JwtBearer",
                ["ArchLucidAuth:Authority"] = "https://login.example.com/tenant/v2.0",
                ["ArchLucidAuth:FailClosedOnOidcDiscoveryError"] = "false",
            })
            .Build();

        OidcAuthorityStartupProbeHostedService sut = new(
            configuration,
            factory,
            lifetime,
            NullLogger<OidcAuthorityStartupProbeHostedService>.Instance);

        await sut.StartAsync(CancellationToken.None);

        lifetime.StopApplicationCallCount.Should().Be(0);
    }

    private sealed class CountingHostApplicationLifetime : IHostApplicationLifetime
    {
        public int StopApplicationCallCount
        {
            get;
            private set;
        }

        public CancellationToken ApplicationStarted => CancellationToken.None;

        public CancellationToken ApplicationStopping => CancellationToken.None;

        public CancellationToken ApplicationStopped => CancellationToken.None;

        public void StopApplication() => StopApplicationCallCount++;
    }

    private sealed class StubHttpClientFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private sealed class StubHttpMessageHandler(HttpStatusCode statusCode) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(new HttpResponseMessage(statusCode));
        }
    }
}
