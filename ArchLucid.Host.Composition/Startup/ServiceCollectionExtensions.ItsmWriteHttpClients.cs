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
        services.AddHttpClient<JiraOutboundIssueClient>(static client => client.Timeout = TimeSpan.FromSeconds(60))
            .ConfigureArchLucidOutboundSocketsHandler(
                OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                rejectPrivateNetworkConnectEndpoints: true)
            .AddOutboundExternalHttpResilienceForReadRetries();
        services.AddHttpClient<ServiceNowOutboundIncidentClient>(static client => client.Timeout = TimeSpan.FromSeconds(60))
            .ConfigureArchLucidOutboundSocketsHandler(
                OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                rejectPrivateNetworkConnectEndpoints: true)
            .AddOutboundExternalHttpResilienceForReadRetries();
        services.AddHttpClient<AzureBoardsOutboundIssueClient>(static client => client.Timeout = TimeSpan.FromSeconds(60))
            .ConfigureArchLucidOutboundSocketsHandler(
                OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                rejectPrivateNetworkConnectEndpoints: true)
            .AddOutboundExternalHttpResilienceForReadRetries();
    }
}
