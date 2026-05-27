using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Startup.Validation;

[Trait("Category", "Unit")]
public sealed class ProductionSecretSourceRulesTests
{
    [SkippableFact]
    public void CollectAzureDevOpsArchLucidApiKeyKeyVaultReference_rejects_raw_key()
    {
        Dictionary<string, string?> settings = new()
        {
            ["AzureDevOps:Enabled"] = "true",
            ["AzureDevOps:ArchLucidApiKey"] = "raw-secret-key"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];
        ProductionSafetyRules.CollectAzureDevOpsArchLucidApiKeyKeyVaultReference(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("ArchLucidApiKey", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectIntegrationEventsServiceBusConnectionStringKeyVaultReference_rejects_raw_connection_string()
    {
        Dictionary<string, string?> settings = new()
        {
            ["IntegrationEvents:ServiceBusConnectionString"] = "Endpoint=sb://x/;SharedAccessKey=abc"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(settings!).Build();
        List<string> errors = [];
        ProductionSafetyRules.CollectIntegrationEventsServiceBusConnectionStringKeyVaultReference(configuration, errors);

        errors.Should().ContainSingle(e => e.Contains("ServiceBusConnectionString", StringComparison.Ordinal));
    }
}
