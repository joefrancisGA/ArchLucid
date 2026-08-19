using ArchLucid.Core.Http;

using ArchLucid.Host.Core.Http;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterMultiCloudPublicPricingHttpClients(this IServiceCollection services)
    {
        services
            .AddHttpClient(
                ArchLucidMultiCloudPublicHttpClients.AwsPricingHttpClientName,
                static http =>
                {
                    http.BaseAddress = ArchLucidMultiCloudPublicHttpClients.AwsPricingAuthority;
                    http.Timeout = TimeSpan.FromMinutes(5);
                    http.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
                })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.CloudControlPlane)
            .AddLongLivedPolicyHandler(static serviceProvider =>
                AzureRetailPricesHttpResiliencePolicy.Create(
                    serviceProvider
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger($"{ArchLucidMultiCloudPublicHttpClients.AwsPricingHttpClientName}.Policies")));

        services
            .AddHttpClient(
                ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingHttpClientName,
                static http =>
                {
                    http.BaseAddress = ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingAuthority;
                    http.Timeout = TimeSpan.FromMinutes(5);
                    http.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
                })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.CloudControlPlane)
            .AddLongLivedPolicyHandler(static serviceProvider =>
                AzureRetailPricesHttpResiliencePolicy.Create(
                    serviceProvider
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger($"{ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingHttpClientName}.Policies")));
    }
}
