using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static readonly TimeSpan AzureRetailPricesCallBudget = TimeSpan.FromMinutes(5);

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
                    http.Timeout = TimeSpan.FromMinutes(5);
                    http.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
                })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.CloudControlPlane)
            .AddLongLivedPolicyHandler(static serviceProvider =>
                ArchLucid.Core.Http.AzureRmAndRetailPricesHttpRetryPolicy.Create(
                    serviceProvider
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger($"{ArchLucid.Core.Http.ArchLucidAzurePublicHttpClients.ResourceManagerHttpClientName}.Policies")));

        services
            .AddHttpClient(
                ArchLucid.Core.Http.ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName,
                static http =>
                {
                    http.BaseAddress = ArchLucid.Core.Http.ArchLucidAzurePublicHttpClients.RetailPricesAuthority;
                    http.Timeout = AzureRetailPricesCallBudget;
                    http.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
                })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.CloudControlPlane)
            .AddLongLivedPolicyHandler(
                static serviceProvider => AzureRetailPricesHttpResiliencePolicy.CreateForAzureRetailPrices(
                    serviceProvider
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger($"{ArchLucid.Core.Http.ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName}.Policies"),
                    AzureRetailPricesCallBudget,
                    serviceProvider.GetService<TimeProvider>()),
                static request => request.Content is null &&
                    (request.Method == HttpMethod.Get || request.Method == HttpMethod.Head));
    }
}
