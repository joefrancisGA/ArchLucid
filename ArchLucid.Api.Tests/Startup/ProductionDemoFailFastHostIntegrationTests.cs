using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests.Startup;

/// <summary>
///     TB-293: production-profile host must fail when demo paths are enabled.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ProductionDemoFailFastHostIntegrationTests
{
    private const string SqlConnectionString =
        "Server=.;Database=ProdDemoFailFast;Trusted_Connection=True;TrustServerCertificate=True";

    private const string SystemSqlConnectionString =
        "Server=.;Database=ProdDemoFailFastSystem;Trusted_Connection=True;TrustServerCertificate=True";

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

    /// <summary>
    ///     Satisfies <see cref="ArchLucid.Host.Core.Startup.Validation.ArchLucidConfigurationRules" /> production
    ///     fail-fast rules so startup reaches <see cref="ArchLucid.Host.Core.Hosted.ConfigurationValidationHostedService" />
    ///     demo-profile checks under test.
    /// </summary>
    private static void ConfigureProductionProfileBaseline(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production");
        builder.UseSetting("ConnectionStrings:ArchLucid", SqlConnectionString);
        builder.UseSetting("AgentExecution:Mode", "Simulator");
        builder.UseSetting("HostLeaderElection:Enabled", "false");
        builder.UseSetting("DataConsistency:InitialDelaySeconds", "0");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ArchLucid:SqlTopology:Mode"] = "SystemWithPerTenantCatalogs",
                    ["ConnectionStrings:ArchLucidSystem"] = SystemSqlConnectionString,
                    ["ArchLucid:SqlTopology:TenantCatalogConnectionStringTemplate"] =
                        "Server=.;Database={DatabaseName};Trusted_Connection=True;TrustServerCertificate=True",
                    ["ArchLucid:Secrets:Provider"] = "KeyVault",
                    ["ArchLucid:Secrets:KeyVaultUri"] = "https://prod-demo-fail-fast.invalid.vault.azure.net/",
                    ["ArchLucid:ContentSafety:Endpoint"] = "https://content-safety.example",
                    ["ArchLucid:ContentSafety:ApiKey"] = "unit-test-content-safety-key",
                    ["Billing:Provider"] = BillingProviderNames.Noop,
                    ["WebhookDelivery:UseHttpClient"] = "false",
                    ["Observability:Otlp:Enabled"] = "false",
                    ["Observability:ConsoleExporter:Enabled"] = "false",
                    ["Retrieval:PlatformDocs:IndexOnStartup"] = "false",
                    ["Retrieval:PolicyPackCorpus:IndexOnStartup"] = "false",
                    ["Retrieval:ExemplarCorpus:IndexOnStartup"] = "false",
                });
        });
    }

    private sealed class ProductionDemoEnabledWebAppFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            ConfigureProductionProfileBaseline(builder);
            builder.UseSetting("Demo:Enabled", "true");
        }
    }

    private sealed class ProductionAnonymousDemoViewerWebAppFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            ConfigureProductionProfileBaseline(builder);
            builder.UseSetting("Demo:AnonymousViewer:Enabled", "true");
        }
    }
}
