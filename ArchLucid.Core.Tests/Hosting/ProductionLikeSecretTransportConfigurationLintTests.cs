using ArchLucid.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Suite", "Core")]
public sealed class ProductionLikeSecretTransportConfigurationLintTests
{
    [Fact]
    public void DescribeAdvisoryFindings_development_returns_empty()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
            [
                new KeyValuePair<string, string?>("IntegrationEvents:QueueOrTopicName", "events"),
                new KeyValuePair<string, string?>("IntegrationEvents:ServiceBusConnectionString", "Endpoint=sb://x/"),
            ])
            .Build();

        IReadOnlyList<HostingMisconfigurationWarning> findings =
            ProductionLikeSecretTransportConfigurationLint.DescribeAdvisoryFindings(
                configuration,
                Environments.Development);

        findings.Should().BeEmpty();
    }

    [Fact]
    public void DescribeAdvisoryFindings_production_service_bus_connection_string_emits_rule()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
            [
                new KeyValuePair<string, string?>("IntegrationEvents:QueueOrTopicName", "events"),
                new KeyValuePair<string, string?>("IntegrationEvents:ServiceBusConnectionString", "Endpoint=sb://x/"),
            ])
            .Build();

        IReadOnlyList<HostingMisconfigurationWarning> findings =
            ProductionLikeSecretTransportConfigurationLint.DescribeAdvisoryFindings(
                configuration,
                Environments.Production);

        findings.Should().ContainSingle(static f =>
            f.RuleName
            == ProductionLikeHostingMisconfigurationAdvisorRuleNames
                .IntegrationEventsServiceBusConnectionStringDisallowedProductionLike);
    }

    [Fact]
    public void DescribeAdvisoryFindings_production_plaintext_api_key_emits_rule()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
            [
                new KeyValuePair<string, string?>("ArchLucidAuth:Mode", "ApiKey"),
                new KeyValuePair<string, string?>("Authentication:ApiKey:Enabled", "true"),
                new KeyValuePair<string, string?>("Authentication:ApiKey:AdminKey", "super-secret-key"),
            ])
            .Build();

        IReadOnlyList<HostingMisconfigurationWarning> findings =
            ProductionLikeSecretTransportConfigurationLint.DescribeAdvisoryFindings(
                configuration,
                Environments.Production);

        findings.Should().Contain(static f =>
            f.RuleName
            == ProductionLikeHostingMisconfigurationAdvisorRuleNames
                .AuthenticationApiKeyAdminKeyPlaintextProductionLike);
    }

    [Fact]
    public void LooksLikeKeyVaultReference_detects_reference_prefix()
    {
        ProductionLikeSecretTransportConfigurationLint
            .LooksLikeKeyVaultReference("@Microsoft.KeyVault(VaultName=v;SecretName=s)")
            .Should()
            .BeTrue();
    }
}
