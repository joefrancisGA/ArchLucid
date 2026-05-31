using ArchLucid.Api.Tests;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     ApiKey mode without <c>Authentication:ApiKey:TenantId</c> — used to assert header-only scope escalation is rejected (TB-072).
/// </summary>
public sealed class ApiKeyUnboundTenantScopeArchLucidApiFactory : ArchLucidApiFactory
{
    private static Dictionary<string, string?> KeyModeConfiguration { get; } = new()
    {
        ["ArchLucidAuth:Mode"] = "ApiKey",
        ["Authentication:ApiKey:Enabled"] = "true",
        ["Authentication:ApiKey:DevelopmentBypassAll"] = "false",
        ["Authentication:ApiKey:AdminKey"] = ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey,
        ["Authentication:ApiKey:ReadOnlyKey"] = ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestReaderApiKey,
    };

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        JwtIntegrationTestEnvironmentOverrides.ApplyApiKey(
            ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestAdminApiKey,
            ApiKeyReaderAndAdminArchLucidApiFactory.IntegrationTestReaderApiKey);

        IConfiguration bootstrap = new ConfigurationBuilder().AddInMemoryCollection(KeyModeConfiguration).Build();
        builder.UseConfiguration(bootstrap);
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(KeyModeConfiguration);
        });
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
            JwtIntegrationTestEnvironmentOverrides.Clear();

        base.Dispose(disposing);
    }
}
