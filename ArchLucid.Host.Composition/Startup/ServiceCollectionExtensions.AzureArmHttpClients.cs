using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    /// <summary>
    ///     Registers Polly-backed <see cref="IHttpClientFactory" /> clients for Azure Resource Manager and public Retail Prices REST calls.
    /// </summary>
    internal static void RegisterAzureArmAndRetailPricesHttpClients(this IServiceCollection services)
    {
        services
            .AddHttpClient(
                ArchLucid.Core.Http.ArchLucidAzurePublicHttpClients.ResourceManagerHttpClientName,
                static http =>
                {
                    http.BaseAddress = ArchLucid.Core.Http.ArchLucidAzurePublicHttpClients.ResourceManagerAuthority;
                    http.Timeout = AzureArmReadHttpClientBuilderExtensions.CallBudget;
                    http.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
                })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.CloudControlPlane)
            .AddDeadlineAwareArmReadRetries(
                $"{ArchLucid.Core.Http.ArchLucidAzurePublicHttpClients.ResourceManagerHttpClientName}.Policies");

        RegisterPublicPricingHttpClient(
            services,
            ArchLucid.Core.Http.ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName,
            ArchLucid.Core.Http.ArchLucidAzurePublicHttpClients.RetailPricesAuthority);
    }
}
