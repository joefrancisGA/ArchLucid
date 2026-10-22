using ArchLucid.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Suite", "Core")]
public sealed class AzureAiSearchProductionLikeConfigurationLintTests
{
    [Fact]
    public void DescribeBlockingFindings_development_host_returns_empty()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
            [
                new KeyValuePair<string, string?>("Retrieval:VectorIndex", "InMemory"),
            ])
            .Build();

        IReadOnlyList<HostingMisconfigurationWarning> findings =
            AzureAiSearchProductionLikeConfigurationLint.DescribeBlockingFindings(
                configuration,
                Environments.Development);

        findings.Should().BeEmpty();
    }

    [Fact]
    public void DescribeBlockingFindings_production_inmemory_emits_vector_index_rule()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
            [
                new KeyValuePair<string, string?>("Retrieval:VectorIndex", "InMemory"),
            ])
            .Build();

        IReadOnlyList<HostingMisconfigurationWarning> findings =
            AzureAiSearchProductionLikeConfigurationLint.DescribeBlockingFindings(
                configuration,
                Environments.Production);

        findings.Should().ContainSingle(static f =>
            f.RuleName
            == ProductionLikeHostingMisconfigurationAdvisorRuleNames.AzureAiSearchVectorIndexRequiredProductionLike);
    }

    [Fact]
    public void DescribeBlockingFindings_production_azure_search_without_endpoint_emits_endpoint_rule()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
            [
                new KeyValuePair<string, string?>("Retrieval:VectorIndex", "AzureSearch"),
            ])
            .Build();

        IReadOnlyList<HostingMisconfigurationWarning> findings =
            AzureAiSearchProductionLikeConfigurationLint.DescribeBlockingFindings(
                configuration,
                Environments.Production);

        findings.Should().ContainSingle(static f =>
            f.RuleName
            == ProductionLikeHostingMisconfigurationAdvisorRuleNames.AzureAiSearchEndpointRequiredProductionLike);
    }

    [Fact]
    public void DescribeBlockingFindings_production_azure_search_configured_returns_empty()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
            [
                new KeyValuePair<string, string?>("Retrieval:VectorIndex", "AzureSearch"),
                new KeyValuePair<string, string?>("Retrieval:AzureSearch:Endpoint", "https://example.search.windows.net"),
            ])
            .Build();

        IReadOnlyList<HostingMisconfigurationWarning> findings =
            AzureAiSearchProductionLikeConfigurationLint.DescribeBlockingFindings(
                configuration,
                Environments.Production);

        findings.Should().BeEmpty();
    }
}
