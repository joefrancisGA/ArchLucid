using ArchLucid.Application.Integrations;
using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Application.Reporting;
using ArchLucid.Core.Http;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Host.Composition.Services;
using ArchLucid.Host.Core.Http;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterIntegrationsOutboundHttpClients(IServiceCollection services)
    {
        services.AddHttpClient<JiraOutboundIssueClient>(static client => client.Timeout = TimeSpan.FromSeconds(60))
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration)
            .AddOutboundExternalHttpResilience();
        services.AddHttpClient<ServiceNowOutboundIncidentClient>(static client => client.Timeout = TimeSpan.FromSeconds(60))
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration)
            .AddOutboundExternalHttpResilience();
        services.AddHttpClient<AzureBoardsOutboundIssueClient>(static client => client.Timeout = TimeSpan.FromSeconds(60))
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration)
            .AddOutboundExternalHttpResilience();
        services
            .AddHttpClient(
                ItsmOutboundIntegrationHealthLimits.HttpClientName,
                static client => client.Timeout = TimeSpan.FromSeconds(ItsmOutboundIntegrationHealthLimits.NetworkTimeoutSeconds))
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration)
            .AddOutboundExternalHttpResilience();
        services
            .AddHttpClient<IOutboundWebhookDryRunService, OutboundWebhookDryRunService>(static client =>
            {
                client.Timeout = TimeSpan.FromSeconds(30);
            })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);
        services
            .AddHttpClient<IItsmConnectorOAuthTokenExchanger, ItsmConnectorOAuthTokenExchanger>(
                static client => client.Timeout = TimeSpan.FromSeconds(30))
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration)
            .AddOutboundExternalHttpResilience();
    }
}
