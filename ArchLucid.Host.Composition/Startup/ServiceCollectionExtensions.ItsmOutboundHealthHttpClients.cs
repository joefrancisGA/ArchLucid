using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    internal static void RegisterItsmOutboundHealthHttpClients(this IServiceCollection services)
    {
        RegisterClient(ItsmOutboundIntegrationHealthLimits.JiraHttpClientName);
        RegisterClient(ItsmOutboundIntegrationHealthLimits.ServiceNowHttpClientName);

        void RegisterClient(string name)
        {
            services
                .AddHttpClient(
                    name,
                    static client => client.Timeout = TimeSpan.FromSeconds(ItsmOutboundIntegrationHealthLimits.NetworkTimeoutSeconds))
                .ConfigureArchLucidOutboundSocketsHandler(
                    OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                    rejectPrivateNetworkConnectEndpoints: true)
                .AddOutboundExternalHttpResilience();
        }
    }
}
