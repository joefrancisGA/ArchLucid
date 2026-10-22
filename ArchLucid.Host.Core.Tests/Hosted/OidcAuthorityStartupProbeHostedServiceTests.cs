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
        CountingStubHttpMessageHandler handler = new(HttpStatusCode.NotFound);
        StubHttpClientFactory factory = new(handler);

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
        await WaitForExecuteTaskAsync(sut);

        handler.SendCount.Should().Be(1, "the OIDC discovery probe should run before fail-closed shutdown");
        lifetime.StopApplicationCallCount.Should().Be(1);
    }

    [Fact]
    public async Task StartAsync_when_fail_closed_disabled_does_not_stop_application()
    {
        CountingHostApplicationLifetime lifetime = new();
        CountingStubHttpMessageHandler handler = new(HttpStatusCode.NotFound);
        StubHttpClientFactory factory = new(handler);

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
        await WaitForExecuteTaskAsync(sut);

        lifetime.StopApplicationCallCount.Should().Be(0);
    }

    private static async Task WaitForExecuteTaskAsync(BackgroundService service)
    {
        Task? executeTask = service.ExecuteTask;

        for (int attempt = 0; executeTask is null && attempt < 50; attempt++)
        {
            await Task.Delay(TimeSpan.FromMilliseconds(10));
            executeTask = service.ExecuteTask;
        }

        executeTask.Should().NotBeNull("StartAsync should schedule ExecuteAsync before assertions run.");

        await executeTask!.WaitAsync(TimeSpan.FromSeconds(30));
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

    private sealed class CountingStubHttpMessageHandler(HttpStatusCode statusCode) : HttpMessageHandler
    {
        public int SendCount
        {
            get;
            private set;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            SendCount++;

            return Task.FromResult(new HttpResponseMessage(statusCode));
        }
    }
}
