using ArchLucid.Application.Connectors.Publishing;
using ArchLucid.Core.Connectors.Publishing;
using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class RunLifecycleOrchestrationCompositionRegistrar
{
    internal static void RegisterConfluencePublishingHttpClient(IServiceCollection services)
    {
        services
            .AddHttpClient<IPublisherConnector, ConfluenceCloudPublisherConnector>(
                static client => client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.ExternalIntegration))
            // A page create has no verified deduplication key. Neither retry nor resend it on redirect.
            .ConfigureArchLucidOutboundSocketsHandler(
                OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                allowAutoRedirect: false)
            .AddOutboundExternalHttpResilienceForReadRetries();
    }
}
