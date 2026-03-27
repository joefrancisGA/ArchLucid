using Microsoft.AspNetCore.Hosting;

namespace ArchiForge.Api.Tests;

/// <summary>
/// API host with a single explicit CORS origin for policy regression tests.
/// </summary>
public sealed class CorsTrustedOriginApiFactory : ArchiForgeApiFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.UseSetting("Cors:AllowedOrigins:0", "https://trusted.app.example");
    }
}
