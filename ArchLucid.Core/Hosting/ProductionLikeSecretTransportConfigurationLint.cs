using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Hosting;

/// <summary>
///     Production-like advisories for secret transport posture (Service Bus connection strings, plaintext API keys).
/// </summary>
public static class ProductionLikeSecretTransportConfigurationLint
{
    public const string IntegrationEventsServiceBusConnectionStringKey =
        "IntegrationEvents:ServiceBusConnectionString";

    public const string AuthenticationApiKeyAdminKeyKey = "Authentication:ApiKey:AdminKey";

    public const string AuthenticationApiKeyReadOnlyKeyKey = "Authentication:ApiKey:ReadOnlyKey";

    public const string AzureOpenAiApiKeyKey = "AzureOpenAI:ApiKey";

    /// <summary>Returns advisory findings for production-like hosting profiles.</summary>
    public static IReadOnlyList<HostingMisconfigurationWarning> DescribeAdvisoryFindings(
        IConfiguration configuration,
        string aspNetCoreEnvironmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.IsNullOrWhiteSpace(aspNetCoreEnvironmentName))
            throw new ArgumentException("ASP.NET Core environment name is required.", nameof(aspNetCoreEnvironmentName));

        if (!ProductionLikeHostingMisconfigurationAdvisor.IsProductionLikeHosting(
                aspNetCoreEnvironmentName.Trim(),
                configuration))
            return [];

        List<HostingMisconfigurationWarning> findings = [];

        AppendServiceBusConnectionStringFinding(configuration, findings);
        AppendPlaintextApiKeyFindings(configuration, findings);
        AppendPlaintextAzureOpenAiApiKeyFinding(configuration, findings);

        return findings;
    }

    internal static bool LooksLikeKeyVaultReference(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        return value.Trim().StartsWith("@Microsoft.KeyVault(", StringComparison.OrdinalIgnoreCase);
    }

    private static void AppendServiceBusConnectionStringFinding(
        IConfiguration configuration,
        List<HostingMisconfigurationWarning> findings)
    {
        string? queueOrTopic = configuration["IntegrationEvents:QueueOrTopicName"]?.Trim();

        if (string.IsNullOrEmpty(queueOrTopic))
            return;

        string? connectionString = configuration[IntegrationEventsServiceBusConnectionStringKey]?.Trim();
        string? fullyQualifiedNamespace =
            configuration["IntegrationEvents:ServiceBusFullyQualifiedNamespace"]?.Trim();

        if (string.IsNullOrEmpty(connectionString) || !string.IsNullOrEmpty(fullyQualifiedNamespace))
            return;

        findings.Add(
            new HostingMisconfigurationWarning(
                ProductionLikeHostingMisconfigurationAdvisorRuleNames
                    .IntegrationEventsServiceBusConnectionStringDisallowedProductionLike,
                "IntegrationEvents:ServiceBusConnectionString is set on production-like hosting. "
                + "Prefer IntegrationEvents:ServiceBusFullyQualifiedNamespace with managed identity "
                + "(see appsettings.KeyVault.sample.json)."));
    }

    private static void AppendPlaintextApiKeyFindings(
        IConfiguration configuration,
        List<HostingMisconfigurationWarning> findings)
    {
        string? mode = configuration["ArchLucidAuth:Mode"]?.Trim();

        if (!string.Equals(mode, "ApiKey", StringComparison.OrdinalIgnoreCase))
            return;

        if (!configuration.GetValue("Authentication:ApiKey:Enabled", false))
            return;

        AppendPlaintextSecretFinding(
            configuration[AuthenticationApiKeyAdminKeyKey],
            AuthenticationApiKeyAdminKeyKey,
            ProductionLikeHostingMisconfigurationAdvisorRuleNames
                .AuthenticationApiKeyAdminKeyPlaintextProductionLike,
            findings);

        AppendPlaintextSecretFinding(
            configuration[AuthenticationApiKeyReadOnlyKeyKey],
            AuthenticationApiKeyReadOnlyKeyKey,
            ProductionLikeHostingMisconfigurationAdvisorRuleNames
                .AuthenticationApiKeyReadOnlyKeyPlaintextProductionLike,
            findings);
    }

    private static void AppendPlaintextAzureOpenAiApiKeyFinding(
        IConfiguration configuration,
        List<HostingMisconfigurationWarning> findings)
    {
        string? mode = configuration["AgentExecution:Mode"]?.Trim();

        if (!string.Equals(mode, "Real", StringComparison.OrdinalIgnoreCase))
            return;

        string authenticationMode = configuration["AzureOpenAI:AuthenticationMode"]?.Trim() ?? "ApiKey";

        if (string.Equals(authenticationMode, "ManagedIdentity", StringComparison.OrdinalIgnoreCase))
            return;

        AppendPlaintextSecretFinding(
            configuration[AzureOpenAiApiKeyKey],
            AzureOpenAiApiKeyKey,
            ProductionLikeHostingMisconfigurationAdvisorRuleNames
                .AzureOpenAiApiKeyPlaintextProductionLike,
            findings);
    }

    private static void AppendPlaintextSecretFinding(
        string? configuredValue,
        string configurationKey,
        string ruleName,
        List<HostingMisconfigurationWarning> findings)
    {
        if (string.IsNullOrWhiteSpace(configuredValue))
            return;

        if (LooksLikeKeyVaultReference(configuredValue))
            return;

        findings.Add(
            new HostingMisconfigurationWarning(
                ruleName,
                $"{configurationKey} appears to contain a plaintext secret on production-like hosting. "
                + "Use a Key Vault reference or managed identity instead."));
    }
}
