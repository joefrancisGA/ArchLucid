using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Persistence.Audit;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Tests.Integrations;

/// <summary>
///     Hosts the API with deterministic outbound ITSM HTTP (<see cref="OutboundHttp" />), optional outbound configuration keys,
///     and <see cref="CapturingAuditRepository" /> so integration tests can assert durable audit append payloads.
/// </summary>
public sealed class ItsmOutboundIssuesIntegrationApiFactory(TimeSpan? jiraHttpTimeout = null, TimeSpan? serviceNowHttpTimeout = null) : ArchLucidApiFactory
{
    private readonly TimeSpan _jiraHttpTimeout = jiraHttpTimeout ?? TimeSpan.FromMinutes(1);

    private readonly TimeSpan _serviceNowHttpTimeout = serviceNowHttpTimeout ?? TimeSpan.FromMinutes(1);

    public RecordingOutboundHttpHandler OutboundHttp { get; } = new();

    public CapturingAuditRepository AuditCapture { get; } = new();

    public bool IncludeJiraOutboundHostConfiguration { get; init; } = true;

    public bool IncludeServiceNowOutboundHostConfiguration
    {
        get; init;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        builder.ConfigureAppConfiguration(
            (_, config) =>
            {
                Dictionary<string, string?> extra = [];

                if (IncludeJiraOutboundHostConfiguration)
                {
                    extra["Integrations:ItsmOutbound:Jira:CloudBaseUrl"] = "https://mock-jira.integration.test";
                    extra["Integrations:ItsmOutbound:Jira:ServiceAccountEmail"] = "bot@example.com";
                    extra["Integrations:ItsmOutbound:Jira:ApiToken"] = "fake-token";
                    extra["Integrations:ItsmOutbound:Jira:DefaultProjectKey"] = "DP";
                }

                if (IncludeServiceNowOutboundHostConfiguration)
                {
                    extra["Integrations:ItsmOutbound:ServiceNow:InstanceBaseUrl"] = "https://mock-sn.integration.test";
                    extra["Integrations:ItsmOutbound:ServiceNow:Username"] = "svc";
                    extra["Integrations:ItsmOutbound:ServiceNow:Password"] = "pwd";
                }

                config.AddInMemoryCollection(extra);
            });

        builder.ConfigureTestServices(
            services =>
            {
                services.RemoveAll<JiraOutboundIssueClient>();
                services.AddTransient(
                    sp =>
                    {
                        HttpClient http = new(OutboundHttp, disposeHandler: false)
                        {
                            Timeout = _jiraHttpTimeout
                        };

                        return new JiraOutboundIssueClient(http, sp.GetRequiredService<ILogger<JiraOutboundIssueClient>>());
                    });

                services.RemoveAll<ServiceNowOutboundIncidentClient>();
                services.AddTransient(
                    sp =>
                    {
                        HttpClient http = new(OutboundHttp, disposeHandler: false)
                        {
                            Timeout = _serviceNowHttpTimeout
                        };

                        return new ServiceNowOutboundIncidentClient(http,
                            sp.GetRequiredService<ILogger<ServiceNowOutboundIncidentClient>>());
                    });

                services.RemoveAll<IAuditRepository>();
                services.AddSingleton<IAuditRepository>(AuditCapture);
            });
    }
}
