using ArchLucid.Core.Http;

using ArchLucid.Host.Core.Http;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static readonly TimeSpan PublicPricingCallBudget = TimeSpan.FromMinutes(5);

    internal static void RegisterMultiCloudPublicPricingHttpClients(this IServiceCollection services)
    {
        RegisterPublicPricingHttpClient(
            services,
            ArchLucidMultiCloudPublicHttpClients.AwsPricingHttpClientName,
            ArchLucidMultiCloudPublicHttpClients.AwsPricingAuthority);
        RegisterPublicPricingHttpClient(
            services,
            ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingHttpClientName,
            ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingAuthority);
    }

    private static void RegisterPublicPricingHttpClient(IServiceCollection services, string name, Uri authority)
    {
        services.AddHttpClient(name, http =>
            {
                http.BaseAddress = authority;
                http.Timeout = PublicPricingCallBudget;
                http.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
            })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.CloudControlPlane)
            .AddLongLivedPolicyHandler(
                serviceProvider => AzureRetailPricesHttpResiliencePolicy.CreateForPublicPricing(
                    serviceProvider.GetRequiredService<ILoggerFactory>().CreateLogger($"{name}.Policies"),
                    PublicPricingCallBudget,
                    serviceProvider.GetService<TimeProvider>()),
                static request => request.Content is null &&
                    (request.Method == HttpMethod.Get || request.Method == HttpMethod.Head));
    }
}
