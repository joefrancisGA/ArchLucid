using System.Text.Json;

using ArchLucid.Core.Billing.AzureMarketplace;
using ArchLucid.Core.Tenancy;

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

    [Fact]
    public void TryGetPlanId_reads_string_encoded_boolean_planId()
    {
        using JsonDocument document = JsonDocument.Parse("""{"planId":"True"}""");

        bool found = MarketplaceWebhookPayloadParser.TryGetPlanId(document.RootElement, out string? planId);

        found.Should().BeTrue();
        planId.Should().Be("true");
    }

    [Fact]
    public void TryGetPlanId_reads_string_encoded_whole_number_double_planId()
    {
        using JsonDocument document = JsonDocument.Parse("""{"planId":"42424242.0"}""");

        bool found = MarketplaceWebhookPayloadParser.TryGetPlanId(document.RootElement, out string? planId);

        found.Should().BeTrue();
        planId.Should().Be("42424242");
    }

    [Fact]
    public void TryGetPlanId_reads_whole_number_double_planId()
    {
        using JsonDocument document = JsonDocument.Parse("""{"planId":42424242.0}""");

        bool found = MarketplaceWebhookPayloadParser.TryGetPlanId(document.RootElement, out string? planId);

        found.Should().BeTrue();
        planId.Should().Be("42424242");
    }

    [Fact]
    public void ReadQuantity_reads_boolean_quantity_instead_of_fallback()
    {
        using JsonDocument document = JsonDocument.Parse("""{"quantity":true}""");

        int quantity = MarketplaceWebhookPayloadParser.ReadQuantity(document.RootElement, fallback: 10);

        quantity.Should().Be(1);
    }

    [Fact]
    public void ReadQuantity_reads_string_encoded_boolean_quantity_instead_of_fallback()
    {
        using JsonDocument document = JsonDocument.Parse("""{"quantity":"true"}""");

        int quantity = MarketplaceWebhookPayloadParser.ReadQuantity(document.RootElement, fallback: 10);

        quantity.Should().Be(1);
    }

    [Fact]
    public void TryGetPlanId_reads_string_encoded_on_planId()
    {
        using JsonDocument document = JsonDocument.Parse("""{"planId":"on"}""");

        bool found = MarketplaceWebhookPayloadParser.TryGetPlanId(document.RootElement, out string? planId);

        found.Should().BeTrue();
        planId.Should().Be("true");
    }

    [Fact]
    public void ReadQuantity_reads_on_synonym_quantity_instead_of_fallback()
    {
        using JsonDocument document = JsonDocument.Parse("""{"quantity":"on"}""");

        int quantity = MarketplaceWebhookPayloadParser.ReadQuantity(document.RootElement, fallback: 10);

        quantity.Should().Be(1);
    }

    [Fact]
    public void TryReadQuantity_rejects_quantity_above_int_max()
    {
        using JsonDocument document = JsonDocument.Parse("""{"quantity":2147483648}""");

        bool ok = MarketplaceWebhookPayloadParser.TryReadQuantity(document.RootElement, out int quantity);

        ok.Should().BeFalse();
        quantity.Should().Be(0);
    }

    [Fact]
    public void ReadQuantity_uses_fallback_when_quantity_above_int_max()
    {
        using JsonDocument document = JsonDocument.Parse("""{"quantity":5000000000}""");

        int quantity = MarketplaceWebhookPayloadParser.ReadQuantity(document.RootElement, fallback: 7);

        quantity.Should().Be(7);
    }

    [Fact]
    public void TryReadQuantity_rejects_string_encoded_quantity_above_int_max()
    {
        using JsonDocument document = JsonDocument.Parse("""{"quantity":"2147483648"}""");

        bool ok = MarketplaceWebhookPayloadParser.TryReadQuantity(document.RootElement, out int quantity);

        ok.Should().BeFalse();
        quantity.Should().Be(0);
    }

    [Theory]
    [InlineData("Contoso-Enterprise-Plan", nameof(TenantTier.Enterprise))]
    [InlineData("contoso-enterprise", nameof(TenantTier.Enterprise))]
    [InlineData("team", nameof(TenantTier.Standard))]
    public void TierStorageCodeFromPlanId_maps_delimited_enterprise_token(string planId, string expectedTier)
    {
        MarketplaceWebhookPayloadParser.TierStorageCodeFromPlanId(planId).Should().Be(expectedTier);
    }

    [Fact]
    public void TierStorageCodeFromPlanId_does_not_false_positive_on_non_enterprise_substring()
    {
        MarketplaceWebhookPayloadParser.TierStorageCodeFromPlanId("NonEnterpriseStandard")
            .Should().Be(nameof(TenantTier.Standard));
    }

    [Fact]
    public void TierStorageCodeFromPlanId_does_not_false_positive_on_non_enterprise_delimited_plan()
    {
        MarketplaceWebhookPayloadParser.TierStorageCodeFromPlanId("contoso-non-enterprise-standard")
            .Should().Be(nameof(TenantTier.Standard));
    }

    [Theory]
    [InlineData("contoso/enterprise/monthly")]
    [InlineData("contoso:enterprise:annual")]
    public void TierStorageCodeFromPlanId_maps_slash_or_colon_delimited_enterprise_token(string planId)
    {
        MarketplaceWebhookPayloadParser.TierStorageCodeFromPlanId(planId)
            .Should()
            .Be(nameof(TenantTier.Enterprise));
    }

    [Theory]
    [InlineData(@"contoso\enterprise\monthly")]
    [InlineData("contoso|enterprise|annual")]
    public void TierStorageCodeFromPlanId_maps_backslash_or_pipe_delimited_enterprise_token(string planId)
    {
        MarketplaceWebhookPayloadParser.TierStorageCodeFromPlanId(planId)
            .Should()
            .Be(nameof(TenantTier.Enterprise));
    }
}
