using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    internal static void RegisterItsmWriteHttpClients(IServiceCollection services)
    {
        services.AddHttpClient<JiraOutboundIssueClient>(static client => client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.DevOpsIntegration))
            .ConfigureArchLucidOutboundSocketsHandler(
                OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                allowAutoRedirect: false,
                rejectPrivateNetworkConnectEndpoints: true)
            .AddOutboundExternalHttpResilienceForReadRetries(OutboundHttpClientTimeoutSeconds.DevOpsIntegration);
        services.AddHttpClient<ServiceNowOutboundIncidentClient>(static client => client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.DevOpsIntegration))
            .ConfigureArchLucidOutboundSocketsHandler(
                OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                allowAutoRedirect: false,
                rejectPrivateNetworkConnectEndpoints: true)
            .AddOutboundExternalHttpResilienceForReadRetries(OutboundHttpClientTimeoutSeconds.DevOpsIntegration);
        services.AddHttpClient<AzureBoardsOutboundIssueClient>(static client => client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.DevOpsIntegration))
            .ConfigureArchLucidOutboundSocketsHandler(
                OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                allowAutoRedirect: false,
                rejectPrivateNetworkConnectEndpoints: true)
            .AddOutboundExternalHttpResilienceForReadRetries(OutboundHttpClientTimeoutSeconds.DevOpsIntegration);
    }
}
