using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ArchLucid.Api.Tests.Startup;

/// <summary>
///     TB-293: production-profile host must fail when demo paths are enabled.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ProductionDemoFailFastHostIntegrationTests
{
    [Fact]
    public void WebApplicationFactory_production_demo_enabled_fails_startup()
    {
        Action act = () =>
        {
            using ProductionDemoEnabledWebAppFactory factory = new();
            _ = factory.CreateClient();
        };

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Demo:Enabled must be false*");
    }

    [Fact]
    public void WebApplicationFactory_production_anonymous_demo_viewer_fails_startup()
    {
        Action act = () =>
        {
            using ProductionAnonymousDemoViewerWebAppFactory factory = new();
            _ = factory.CreateClient();
        };

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Demo:AnonymousViewer:Enabled must be false*");
    }

    private sealed class ProductionDemoEnabledWebAppFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Demo:Enabled", "true");
            builder.UseSetting("ConnectionStrings:ArchLucid",
                "Server=.;Database=ProdDemoFailFast;Trusted_Connection=True;TrustServerCertificate=True");
            builder.UseSetting("AgentExecution:Mode", "Simulator");
            builder.UseSetting("HostLeaderElection:Enabled", "false");
            builder.UseSetting("DataConsistency:InitialDelaySeconds", "0");
        }
    }

    private sealed class ProductionAnonymousDemoViewerWebAppFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Demo:AnonymousViewer:Enabled", "true");
            builder.UseSetting("ConnectionStrings:ArchLucid",
                "Server=.;Database=ProdDemoFailFast;Trusted_Connection=True;TrustServerCertificate=True");
            builder.UseSetting("AgentExecution:Mode", "Simulator");
            builder.UseSetting("HostLeaderElection:Enabled", "false");
            builder.UseSetting("DataConsistency:InitialDelaySeconds", "0");
        }
    }
}
