using ArchLucid.Application.AzureExtractor;
using ArchLucid.Contracts.AzureExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorResultEnricherTests
{
    [Fact]
    public void ParseResourceGroupAndName_parses_arm_id()
    {
        (string resourceGroup, string shortName) = AzureExtractorResultEnricher.ParseResourceGroupAndName(
            "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/prod-rg/providers/Microsoft.Web/sites/my-app");

        resourceGroup.Should().Be("prod-rg");
        shortName.Should().Be("my-app");
    }

    [Fact]
    public async Task EnrichAsync_when_disabled_returns_passthrough()
    {
        StubAgentCompletionClient completionClient = new("{}");
        AzureExtractorResultEnricher enricher = new(
            completionClient,
            Options.Create(new AzureExtractorEnrichmentOptions { Enabled = false }),
            NullLogger<AzureExtractorResultEnricher>.Instance);

        IReadOnlyList<AzureExtractorInventoryResourceLine> lines =
        [
            new AzureExtractorInventoryResourceLine("app1", "Microsoft.Web/sites", null, null),
        ];

        IReadOnlyList<EnrichedAzureExtractorInventoryLine> result =
            await enricher.EnrichAsync(lines, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ResourceType.Should().Be("Microsoft.Web/sites");
        result[0].Location.Should().BeNull();
        completionClient.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task EnrichAsync_when_enabled_fills_missing_location()
    {
        const string json = """
                            {
                              "resourceType": "Microsoft.Web/sites",
                              "location": "eastus",
                              "tier": "P1v3",
                              "inferred": true
                            }
                            """;

        StubAgentCompletionClient completionClient = new(json);
        AzureExtractorResultEnricher enricher = new(
            completionClient,
            Options.Create(new AzureExtractorEnrichmentOptions { Enabled = true }),
            NullLogger<AzureExtractorResultEnricher>.Instance);

        IReadOnlyList<AzureExtractorInventoryResourceLine> lines =
        [
            new AzureExtractorInventoryResourceLine(
                "/subscriptions/x/resourceGroups/prod-rg/providers/Microsoft.Web/sites/my-app",
                "Microsoft.Web/sites",
                null,
                null),
        ];

        IReadOnlyList<EnrichedAzureExtractorInventoryLine> result =
            await enricher.EnrichAsync(lines, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Location.Should().Be("eastus");
        result[0].LocationInferred.Should().BeTrue();
        result[0].Tier.Should().Be("P1v3");
        result[0].TierInferred.Should().BeTrue();
        result[0].ResourceGroup.Should().Be("prod-rg");
    }

    private sealed class StubAgentCompletionClient(string json) : IAgentCompletionClient
    {
        public int CallCount
        {
            get;
            private set;
        }

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            CallCount++;

            return Task.FromResult(json);
        }
    }
}
