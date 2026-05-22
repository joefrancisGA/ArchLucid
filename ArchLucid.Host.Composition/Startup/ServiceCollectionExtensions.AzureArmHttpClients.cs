using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    /// <summary>
    ///     Registers Polly-backed <see cref="IHttpClientFactory" /> clients for Azure Resource Manager and public Retail Prices REST calls.
    /// </summary>
    private static void RegisterAzureArmAndRetailPricesHttpClients(this IServiceCollection services)
    {
        services
            .AddHttpClient(
                ArchLucidAzurePublicHttpClients.ResourceManagerHttpClientName,
                static http =>
                {
                    http.BaseAddress = ArchLucidAzurePublicHttpClients.ResourceManagerAuthority;
                    http.Timeout = TimeSpan.FromMinutes(5);
                    http.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
                })
            .AddPolicyHandler(
                static (serviceProvider, _) =>
                    AzureRmAndRetailPricesHttpRetryPolicy.Create(
                        serviceProvider
                            .GetRequiredService<ILoggerFactory>()
                            .CreateLogger($"{ArchLucidAzurePublicHttpClients.ResourceManagerHttpClientName}.Policies")));

        services
            .AddHttpClient(
                ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName,
                static http =>
                {
                    http.BaseAddress = ArchLucidAzurePublicHttpClients.RetailPricesAuthority;
                    http.Timeout = TimeSpan.FromMinutes(5);
                    http.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
                })
            .AddPolicyHandler(
                static (serviceProvider, _) =>
                    AzureRetailPricesHttpResiliencePolicy.Create(
                        serviceProvider
                            .GetRequiredService<ILoggerFactory>()
                            .CreateLogger($"{ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName}.Policies")));
    }
}
