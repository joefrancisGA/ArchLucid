using ArchLucid.Persistence.Audit;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

using WireMock.Server;

namespace ArchLucid.Api.Tests.Integrations;

/// <summary>
///     Hosted API with outbound ITSM integrations pointing at <see cref="WireMockServer" /> (production HttpClient registrations).
/// </summary>
public sealed class ItsmOutboundIssuesWireMockApiFactory : ArchLucidApiFactory
{
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
}
