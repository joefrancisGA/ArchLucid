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

/// <summary>Cosmos, ACS email, Stripe billing, Azure Marketplace, and Azure DevOps secret rules.</summary>
public sealed partial class ArchLucidConfigurationRulesTests
{
    [SkippableFact]
    public void CollectErrors_WhenCosmosFeatureEnabledWithoutConnectionString_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["CosmosDb:GraphSnapshotsEnabled"] = "true",
            ["CosmosDb:ConnectionString"] = "",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("CosmosDb:ConnectionString", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiAndCosmosEmulatorEndpoint_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=x;Trusted_Connection=True;TrustServerCertificate=True",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["CosmosDb:AgentTracesEnabled"] = "true",
            ["CosmosDb:ConnectionString"] = "AccountEndpoint=https://localhost:8081/;AccountKey=dummy"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("Cosmos Emulator", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiAndAcsEmailWithoutEndpoint_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Email:Provider"] = EmailProviderNames.AzureCommunicationServices
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .Contain(e => e.Contains("Email:AzureCommunicationServicesEndpoint", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionWorkerAndAcsEmailWithoutEndpoint_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["Hosting:Role"] = "Worker",
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Email:Provider"] = EmailProviderNames.AzureCommunicationServices
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .Contain(e => e.Contains("Email:AzureCommunicationServicesEndpoint", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiAndAcsEmailWithConfiguredEndpoint_does_not_add_acs_endpoint_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Email:Provider"] = EmailProviderNames.AzureCommunicationServices,
            ["Email:AzureCommunicationServicesEndpoint"] = "https://contoso.communication.azure.com/"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .NotContain(e => e.Contains("Email:AzureCommunicationServicesEndpoint", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiAndStripeBillingWithoutSecretKey_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Billing:Provider"] = BillingProviderNames.Stripe
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("Billing:Stripe:SecretKey", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionWorkerAndStripeBillingWithoutSecretKey_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["Hosting:Role"] = "Worker",
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Billing:Provider"] = BillingProviderNames.Stripe
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("Billing:Stripe:SecretKey", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiAndStripeBillingWithSecretKey_has_no_billing_secret_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Billing:Provider"] = BillingProviderNames.Stripe,
            // Intentionally not sk_test_/sk_live_ shaped — gitleaks flags those as real Stripe tokens.
            ["Billing:Stripe:SecretKey"] = "unit-test-keyvault-ref-stripe-secret-not-a-real-key"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("Billing:Stripe:SecretKey", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiAndStripeLiveKeyWithoutWebhookSigningSecret_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Billing:Provider"] = BillingProviderNames.Stripe,
            ["Billing:Stripe:SecretKey"] = "sk_live_unit_test_placeholder_not_a_real_key",
            ["Billing:Stripe:WebhookSigningSecret"] = ""
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("sk_live_", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiAndAzureMarketplaceGaWithoutOfferId_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Billing:Provider"] = BillingProviderNames.AzureMarketplace,
            ["Billing:AzureMarketplace:LandingPageUrl"] = "https://app.example.com/marketplace/landing",
            ["Billing:AzureMarketplace:GaEnabled"] = "true",
            ["Billing:AzureMarketplace:MarketplaceOfferId"] = ""
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("MarketplaceOfferId", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionApiAndAzureMarketplaceLocalhostLanding_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["Billing:Provider"] = BillingProviderNames.AzureMarketplace,
            ["Billing:AzureMarketplace:LandingPageUrl"] = "https://127.0.0.1:3000/marketplace/landing",
            ["Billing:AzureMarketplace:GaEnabled"] = "false",
            ["Billing:AzureMarketplace:MarketplaceOfferId"] = "ignored-when-ga-off"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("loopback", StringComparison.OrdinalIgnoreCase)
                                     || e.Contains("localhost", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndAzureDevOpsEnabledWithRawPat_contains_key_vault_reference_error()
    {
        Dictionary<string, string?> data = new(ProductionApiBaselineWithBillingNoop())
        {
            ["AzureDevOps:Enabled"] = "true",
            ["AzureDevOps:PersonalAccessToken"] = "unit-test-raw-pat-placeholder-not-a-real-secret",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .Contain(e => e.Contains("AzureDevOps:PersonalAccessToken must use a Key Vault reference",
                StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndAzureDevOpsEnabledWithKeyVaultPat_does_not_add_raw_pat_error()
    {
        Dictionary<string, string?> data = new(ProductionApiBaselineWithBillingNoop())
        {
            ["AzureDevOps:Enabled"] = "true",
            ["AzureDevOps:PersonalAccessToken"] =
                "@Microsoft.KeyVault(SecretUri=https://fake.vault.azure.net/secrets/ado-pat/unit-test/)",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .NotContain(e =>
                e.Contains("AzureDevOps:PersonalAccessToken must use a Key Vault reference", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenDevelopmentAndAzureDevOpsEnabledWithRawPat_does_not_add_key_vault_reference_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["AzureDevOps:Enabled"] = "true",
            ["AzureDevOps:PersonalAccessToken"] = "dev-raw-pat-ok-in-non-production",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .NotContain(e =>
                e.Contains("AzureDevOps:PersonalAccessToken must use a Key Vault reference", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionAndAzureDevOpsDisabledWithRawPat_does_not_add_key_vault_reference_error()
    {
        Dictionary<string, string?> data = new(ProductionApiBaselineWithBillingNoop())
        {
            ["AzureDevOps:Enabled"] = "false", ["AzureDevOps:PersonalAccessToken"] = "ignored-when-disabled",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .NotContain(e =>
                e.Contains("AzureDevOps:PersonalAccessToken must use a Key Vault reference", StringComparison.Ordinal));
    }
}
