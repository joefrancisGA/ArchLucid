using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Integrations.AzureExtractor;

public static class HostedAzureExtractorServiceCollectionExtensions
{
    public static IServiceCollection AddArchLucidHostedAzureExtractor(
        this IServiceCollection services)
    {
        services.AddSingleton<IHostedAzureExtractorCredentialFactory, WorkloadIdentityHostedAzureExtractorCredentialFactory>();
        services.AddHttpClient<IHostedAzureArmReadClient, GetOnlyHostedAzureArmReadClient>(static client =>
        {
            client.Timeout = TimeSpan.FromMinutes(5);
        });
        services.AddScoped<IHostedAzureExtractorClient, HostedAzureExtractorClient>();

        return services;
    }
}
