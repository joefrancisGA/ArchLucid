using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]

/// <summary>SQL topology, failover listener, connection-string secret, and telemetry-export rules.</summary>
public sealed partial class ArchLucidConfigurationRulesTests
{
    [SkippableFact]
    public void CollectErrors_WhenProductionAndSingleCatalogTopology_contains_error()
    {
        Dictionary<string, string?> data = new(ProductionApiBaselineWithBillingNoop())
        {
            ["ArchLucid:SqlTopology:Mode"] = "SingleCatalog",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("SingleCatalog", StringComparison.Ordinal)
            && e.Contains("SystemWithPerTenantCatalogs", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenStagingAndSingleCatalogTopology_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["ArchLucid:SqlTopology:Mode"] = "SingleCatalog",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Staging);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("SingleCatalog", StringComparison.Ordinal)
            && e.Contains("SystemWithPerTenantCatalogs", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenDevelopmentAndSingleCatalogTopology_skips_topology_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["ArchLucid:SqlTopology:Mode"] = "SingleCatalog",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e =>
            e.Contains("SingleCatalog", StringComparison.Ordinal)
            && e.Contains("SystemWithPerTenantCatalogs", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenDevelopmentAndArchLucidProductionAndSingleCatalog_contains_topology_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ARCHLUCID_ENVIRONMENT"] = "Production",
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.microsoftonline.com/tenant/v2.0",
            ["ArchLucid:ContentSafety:Endpoint"] = "https://content-safety.example",
            ["ArchLucid:ContentSafety:ApiKey"] = "test-key",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["ArchLucid:SqlTopology:Mode"] = "SingleCatalog",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("SingleCatalog", StringComparison.Ordinal)
            && e.Contains("SystemWithPerTenantCatalogs", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndPerTenantCatalogsTopology_does_not_contain_topology_error()
    {
        IConfiguration configuration =
            new ConfigurationBuilder().AddInMemoryCollection(ProductionApiBaselineWithBillingNoop()).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e =>
            e.Contains("SingleCatalog", StringComparison.Ordinal)
            && e.Contains("SystemWithPerTenantCatalogs", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndFailoverListenerFqdnMismatch_contains_error()
    {
        Dictionary<string, string?> data = ProductionApiBaselineWithBillingNoop();
        data["ConnectionStrings:ArchLucid"] =
            "Server=tcp:sql-primary.database.windows.net,1433;Database=ArchLucid;Encrypt=True;";
        data["SqlServer:FailoverGroupListenerFqdn"] = "archlucid-prod-sqlfg.database.windows.net";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("failover group listener FQDN", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndFailoverListenerFqdnMatches_does_not_contain_listener_error()
    {
        Dictionary<string, string?> data = ProductionApiBaselineWithBillingNoop();
        data["ConnectionStrings:ArchLucid"] =
            "Server=tcp:archlucid-prod-sqlfg.database.windows.net,1433;Database=ArchLucid;Encrypt=True;";
        data["SqlServer:FailoverGroupListenerFqdn"] = "archlucid-prod-sqlfg.database.windows.net";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e =>
            e.Contains("failover group listener FQDN", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndFailoverListenerFqdnUnset_skips_listener_validation()
    {
        Dictionary<string, string?> data = ProductionApiBaselineWithBillingNoop();

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e =>
            e.Contains("failover group listener FQDN", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndSqlPasswordInConnectionString_contains_password_error()
    {
        Dictionary<string, string?> data = ProductionApiBaselineWithBillingNoop();
        data["ConnectionStrings:ArchLucid"] =
            "Server=tcp:sql.database.windows.net,1433;Database=ArchLucid;User ID=sa;Password=secret;Encrypt=True;";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("contains a Password", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndSqlUserIdWithoutAuthentication_contains_user_id_error()
    {
        Dictionary<string, string?> data = ProductionApiBaselineWithBillingNoop();
        data["ConnectionStrings:ArchLucid"] =
            "Server=tcp:sql.database.windows.net,1433;Database=ArchLucid;User ID=sa;Encrypt=True;";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("User ID without Authentication=", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenDevelopmentAndSqlPasswordInConnectionString_does_not_contain_password_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=Dev;User ID=sa;Password=secret;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["WebhookDelivery:UseHttpClient"] = "false",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("contains a Password", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenStagingAndSqlPasswordInConnectionString_does_not_contain_password_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=Staging;User ID=sa;Password=secret;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["WebhookDelivery:UseHttpClient"] = "false",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Staging);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("contains a Password", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiRequiresTelemetryExportAndNoSink_contains_fail_fast_rule()
    {
        Dictionary<string, string?> data = ProductionApiBaselineWithBillingNoop();
        data["ProductionValidation:RequireTelemetryExport"] = "true";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .Contain(e => e.Contains(
                ProductionLikeHostingMisconfigurationAdvisorRuleNames.TelemetryExportRequiredMissing,
                StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionWorkerRequiresTelemetryExportAndNoSink_contains_fail_fast_rule()
    {
        Dictionary<string, string?> data = ProductionApiBaselineWithBillingNoop();
        data["Hosting:Role"] = "Worker";
        data["ProductionValidation:RequireTelemetryExport"] = "true";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .Contain(e => e.Contains(
                ProductionLikeHostingMisconfigurationAdvisorRuleNames.TelemetryExportRequiredMissing,
                StringComparison.OrdinalIgnoreCase));
    }
}
