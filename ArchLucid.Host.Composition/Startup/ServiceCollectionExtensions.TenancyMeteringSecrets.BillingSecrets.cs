using ArchLucid.Core.Configuration;
using ArchLucid.Core.IntegrationSecrets;
using ArchLucid.Core.Secrets;
using ArchLucid.Host.Core.Configuration.IntegrationSecrets;
using ArchLucid.Host.Core.Configuration.Secrets;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterTenancyBillingSecrets(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ArchLucidSecretOptions>(configuration.GetSection(ArchLucidSecretOptions.SectionName));
        services.Configure<IntegrationsAtlassianOAuthOptions>(
            configuration.GetSection(IntegrationsAtlassianOAuthOptions.SectionName));

        services.AddSingleton<InMemoryIntegrationSecretStore>();

        services.AddSingleton<ISecretProvider>(sp =>
        {
            IOptions<ArchLucidSecretOptions> options = sp.GetRequiredService<IOptions<ArchLucidSecretOptions>>();
            ArchLucidSecretOptions o = options.Value;
            InMemoryIntegrationSecretStore overlay = sp.GetRequiredService<InMemoryIntegrationSecretStore>();

            if (o.Provider == SecretProviderKind.KeyVault)
            {
                return new KeyVaultSecretProvider(
                    Options.Create(o),
                    sp.GetRequiredService<IMemoryCache>());
            }

            ISecretProvider inner = new EnvironmentVariableSecretProvider(sp.GetRequiredService<IConfiguration>());

            return new CompositeSecretProvider(inner, overlay);
        });

        services.AddSingleton<IIntegrationSecretWriter>(sp =>
        {
            IOptions<ArchLucidSecretOptions> options = sp.GetRequiredService<IOptions<ArchLucidSecretOptions>>();
            ArchLucidSecretOptions o = options.Value;

            if (o.Provider == SecretProviderKind.KeyVault)
            {
                return new KeyVaultIntegrationSecretWriter(
                    Options.Create(o),
                    sp.GetRequiredService<IMemoryCache>());
            }

            return new InMemoryIntegrationSecretWriter(sp.GetRequiredService<InMemoryIntegrationSecretStore>());
        });
    }
}
