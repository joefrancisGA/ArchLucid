using ArchLucid.Core.Http;
using ArchLucid.Host.Composition.Services;
using ArchLucid.Host.Core.Diagnostics;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Startup;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterHostedStartupProbes(IServiceCollection services, IConfiguration configuration)
    {
        services.AddHostedService<ConfigurationValidationHostedService>();
        services.AddHostedService<OidcAuthorityStartupProbeHostedService>();
        services.AddHostedService<SamlSigningCertificateStartupWarningHostedService>();
        services.AddSingleton<StartupMigrationHealthState>();
        services.AddHttpClient(nameof(ConfigurationHealthProbe), static client =>
        {
            client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.InternalLoopbackProbe);
        })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.InternalLoopback);
        services.AddScoped<IConfigurationHealthProbe>(sp =>
            new ConfigurationHealthProbe(
                sp.GetRequiredService<IConfiguration>(),
                sp.GetService<Persistence.Connections.ISqlConnectionFactory>(),
                sp.GetRequiredService<IHttpClientFactory>()));
    }
}
