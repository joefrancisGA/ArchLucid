using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Audit;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

using WireMock.Server;

namespace ArchLucid.Api.Tests.Integrations;

/// <summary>
///     Hosted API with outbound ITSM integrations pointing at <see cref="WireMockServer" /> (production HttpClient registrations).
/// </summary>
public sealed class ItsmOutboundIssuesWireMockApiFactory : ArchLucidApiFactory
{
    /// <summary>Deterministic <see cref="ArchLucid.Core.Configuration.PublicSiteOptions.BaseUrl" /> for WireMock assertions (deep-link block on outbound descriptions).</summary>
    public const string TestPublicSiteBaseUrl = "https://itsm-outbound-wiremock.test";

    private readonly Lazy<WireMockServer> _upstreamLazy = new(static () => WireMockServer.Start());

    public CapturingAuditRepository AuditCapture { get; } = new();

    public WireMockServer UpstreamWireMock => _upstreamLazy.Value;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        builder.ConfigureAppConfiguration(
            (_, config) =>
            {
                string origin = UpstreamWireMock.Url!.TrimEnd('/');

                config.AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["ArchLucid:PublicSite:BaseUrl"] = TestPublicSiteBaseUrl,
                        ["Integrations:ItsmOutbound:Jira:CloudBaseUrl"] = origin,
                        ["Integrations:ItsmOutbound:Jira:ServiceAccountEmail"] = "bot@example.com",
                        ["Integrations:ItsmOutbound:Jira:ApiToken"] = "fake-token",
                        ["Integrations:ItsmOutbound:Jira:DefaultProjectKey"] = "DP",
                        ["Integrations:ItsmOutbound:ServiceNow:InstanceBaseUrl"] = origin,
                        ["Integrations:ItsmOutbound:ServiceNow:Username"] = "svc",
                        ["Integrations:ItsmOutbound:ServiceNow:Password"] = "pwd",
                    });
            });

        builder.ConfigureTestServices(
            services =>
            {
                // CI may set ArchLucid__PublicSite__BaseUrl; in-memory config alone can lose to env. Pin options for assertions.
                services.RemoveAll<IOptionsMonitor<PublicSiteOptions>>();
                services.AddSingleton<IOptionsMonitor<PublicSiteOptions>>(_ =>
                    new FixedPublicSiteOptionsMonitor(TestPublicSiteBaseUrl));

                services.RemoveAll<IAuditRepository>();
                services.AddSingleton<IAuditRepository>(AuditCapture);
            });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (!disposing || !_upstreamLazy.IsValueCreated)
            return;

        _upstreamLazy.Value.Dispose();
    }

    private sealed class FixedPublicSiteOptionsMonitor : IOptionsMonitor<PublicSiteOptions>
    {
        public FixedPublicSiteOptionsMonitor(string baseUrl) =>
            CurrentValue = new PublicSiteOptions { BaseUrl = baseUrl };

        public PublicSiteOptions CurrentValue { get; }

        public PublicSiteOptions Get(string? name) => CurrentValue;

        public IDisposable OnChange(Action<PublicSiteOptions, string?> listener) => NoopDisposable.Instance;
    }

    private sealed class NoopDisposable : IDisposable
    {
        public static NoopDisposable Instance { get; } = new();

        public void Dispose()
        {
        }
    }
}
