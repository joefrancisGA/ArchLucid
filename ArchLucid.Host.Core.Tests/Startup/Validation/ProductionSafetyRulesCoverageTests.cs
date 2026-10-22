using System.Text;

using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProductionSafetyRulesCoverageTests
{
    [Fact]
    public void CollectEphemeralStorageDisallowedInProductionLike_rejects_in_memory_on_staging()
    {
        Dictionary<string, string?> settings = new();
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        ArchLucidOptions options = new() { StorageProvider = "InMemory" };
        TestHostEnvironment environment = new() { EnvironmentName = Environments.Staging };
        List<string> errors = [];

        ProductionSafetyRules.CollectEphemeralStorageDisallowedInProductionLike(configuration, environment, options, errors);

        errors.Should().ContainSingle(e => e.Contains("StorageProvider=InMemory", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectBillingStripeSecret_requires_secret_when_provider_is_stripe()
    {
        Dictionary<string, string?> settings = new()
        {
            ["Billing:Provider"] = "Stripe",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        ProductionSafetyRules.CollectBillingStripeSecret(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("Billing:Stripe:SecretKey", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectTransactionalEmailAcs_requires_endpoint_when_provider_is_acs()
    {
        Dictionary<string, string?> settings = new()
        {
            ["Email:Provider"] = "AzureCommunicationServices",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        ProductionSafetyRules.CollectTransactionalEmailAcs(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("AzureCommunicationServicesEndpoint", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectAzureDevOpsPersonalAccessTokenKeyVaultReference_rejects_raw_pat()
    {
        Dictionary<string, string?> settings = new()
        {
            ["AzureDevOps:Enabled"] = "true",
            ["AzureDevOps:PersonalAccessToken"] = "raw-pat",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        ProductionSafetyRules.CollectAzureDevOpsPersonalAccessTokenKeyVaultReference(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("PersonalAccessToken", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectTrialAuthExternalId_requires_tenant_id_when_mode_enabled()
    {
        const string json = """
                            {
                              "Auth": {
                                "Trial": {
                                  "Modes": [ "MsaExternalId" ],
                                  "ExternalIdTenantId": ""
                                }
                              }
                            }
                            """;
        using MemoryStream stream = new(Encoding.UTF8.GetBytes(json));
        IConfiguration configuration = new ConfigurationBuilder().AddJsonStream(stream).Build();
        List<string> errors = [];

        ProductionSafetyRules.CollectTrialAuthExternalId(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("ExternalIdTenantId", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectSingleCatalogDisallowedInProductionLike_rejects_single_catalog()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ArchLucid:SqlTopology:Mode"] = nameof(SqlTopologyMode.SingleCatalog),
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        TestHostEnvironment environment = new() { EnvironmentName = Environments.Production };
        List<string> errors = [];

        ProductionSafetyRules.CollectSingleCatalogDisallowedInProductionLike(configuration, environment, errors);

        errors.Should().ContainSingle(e => e.Contains("SingleCatalog", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectCors_rejects_empty_origins_and_wildcard()
    {
        List<string> emptyErrors = [];
        ProductionSafetyRules.CollectCors(new ConfigurationBuilder().Build(), emptyErrors);
        emptyErrors.Should().ContainSingle(e => e.Contains("Cors:AllowedOrigins", StringComparison.Ordinal));

        Dictionary<string, string?> settings = new()
        {
            ["Cors:AllowedOrigins:0"] = "*",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> wildcardErrors = [];

        ProductionSafetyRules.CollectCors(configuration, wildcardErrors);

        wildcardErrors.Should().ContainSingle(e => e.Contains("wildcard", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void CollectWebhookSecrets_requires_secret_and_minimum_length()
    {
        Dictionary<string, string?> missing = new()
        {
            ["WebhookDelivery:UseHttpClient"] = "true",
        };
        List<string> missingErrors = [];
        ProductionSafetyRules.CollectWebhookSecrets(
            new ConfigurationBuilder().AddInMemoryCollection(missing!).Build(),
            missingErrors);
        missingErrors.Should().ContainSingle(e => e.Contains("HmacSha256SharedSecret", StringComparison.Ordinal));

        Dictionary<string, string?> shortSecret = new()
        {
            ["WebhookDelivery:UseHttpClient"] = "true",
            ["WebhookDelivery:HmacSha256SharedSecret"] = "short",
        };
        List<string> shortErrors = [];
        ProductionSafetyRules.CollectWebhookSecrets(
            new ConfigurationBuilder().AddInMemoryCollection(shortSecret!).Build(),
            shortErrors);
        shortErrors.Should().ContainSingle(e => e.Contains("at least 32", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectDemoDisallowedInProductionProfile_rejects_enabled_demo_flags()
    {
        Dictionary<string, string?> settings = new()
        {
            ["ASPNETCORE_ENVIRONMENT"] = "Production",
            ["Demo:Enabled"] = "true",
            ["Demo:AnonymousViewer:Enabled"] = "true",
        };
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];

        ProductionSafetyRules.CollectDemoDisallowedInProductionProfile(configuration, errors);

        errors.Should().HaveCount(2);
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;

        public string ApplicationName { get; set; } = "ArchLucid.Host.Core.Tests";

        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;

        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
