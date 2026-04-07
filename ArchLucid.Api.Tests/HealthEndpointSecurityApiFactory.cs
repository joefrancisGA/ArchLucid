using Microsoft.AspNetCore.Hosting;

namespace ArchLucid.Api.Tests;

/// <summary>
/// API host using API-key auth so unauthenticated requests are truly anonymous (unlike DevelopmentBypass, which always authenticates).
/// </summary>
public sealed class HealthEndpointSecurityApiFactory : ArchLucidApiFactory
{
    public const string IntegrationTestAdminApiKey = "health-endpoint-security-test-admin-key";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        // UseSetting is applied late so it wins over appsettings.json / user secrets (DevelopmentBypass would otherwise authenticate every request).
        builder.UseSetting("ArchiForgeAuth:Mode", "ApiKey");
        builder.UseSetting("Authentication:ApiKey:Enabled", "true");
        builder.UseSetting("Authentication:ApiKey:DevelopmentBypassAll", "false");
        builder.UseSetting("Authentication:ApiKey:AdminKey", IntegrationTestAdminApiKey);
    }
}
