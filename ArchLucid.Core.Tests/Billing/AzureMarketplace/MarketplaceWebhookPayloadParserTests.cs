using System.Text.Json;

using ArchLucid.Core.Billing.AzureMarketplace;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Billing.AzureMarketplace;

[Trait("Category", "Unit")]
public sealed class MarketplaceWebhookPayloadParserTests
{
    [Fact]
    public void ReadQuantity_reads_string_encoded_quantity()
    {
        using JsonDocument document = JsonDocument.Parse("""{"quantity":"5"}""");

        int quantity = MarketplaceWebhookPayloadParser.ReadQuantity(document.RootElement);

        quantity.Should().Be(5);
    }

    [Fact]
    public void ReadQuantity_reads_PascalCase_quantity()
    {
        using JsonDocument document = JsonDocument.Parse("""{"Quantity":5}""");

        int quantity = MarketplaceWebhookPayloadParser.ReadQuantity(document.RootElement);

        quantity.Should().Be(5);
    }

    [Fact]
    public void ReadQuantity_reads_camelCase_quantity()
    {
        using JsonDocument document = JsonDocument.Parse("""{"quantity":3}""");

        int quantity = MarketplaceWebhookPayloadParser.ReadQuantity(document.RootElement);

        quantity.Should().Be(3);
    }

    [Fact]
    public void ReadQuantity_reads_whole_number_double_quantity()
    {
        using JsonDocument document = JsonDocument.Parse("""{"quantity":5.0}""");

        int quantity = MarketplaceWebhookPayloadParser.ReadQuantity(document.RootElement);

        quantity.Should().Be(5);
    }

    [Fact]
    public void ReadQuantity_reads_string_encoded_whole_number_quantity()
    {
        using JsonDocument document = JsonDocument.Parse("""{"quantity":"5.0"}""");

        int quantity = MarketplaceWebhookPayloadParser.ReadQuantity(document.RootElement);

        quantity.Should().Be(5);
    }

    [Fact]
    public void TryGetPlanId_reads_boolean_planId()
    {
        using JsonDocument document = JsonDocument.Parse("""{"planId":true}""");

        bool found = MarketplaceWebhookPayloadParser.TryGetPlanId(document.RootElement, out string? planId);

        found.Should().BeTrue();
        planId.Should().Be("true");
    }
}
