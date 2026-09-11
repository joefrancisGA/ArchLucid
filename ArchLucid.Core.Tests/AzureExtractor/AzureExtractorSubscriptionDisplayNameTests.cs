using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorSubscriptionDisplayNameTests
{
    [Fact]
    public void Normalize_returns_trimmed_buyer_facing_name()
    {
        AzureExtractorSubscriptionDisplayName.Normalize("  Contoso Production  ").Should().Be("Contoso Production");
    }

    [Fact]
    public void Normalize_returns_null_for_blank_or_guid_values()
    {
        AzureExtractorSubscriptionDisplayName.Normalize(null).Should().BeNull();
        AzureExtractorSubscriptionDisplayName.Normalize("   ").Should().BeNull();
        AzureExtractorSubscriptionDisplayName.Normalize("8aa56f3b-18bc-43ca-ad45-bad9e811d33b").Should().BeNull();
        AzureExtractorSubscriptionDisplayName.Normalize("8aa56f3b18bc43caad45bad9e811d33b").Should().BeNull();
    }

    [Fact]
    public void Normalize_truncates_to_snapshot_column_length()
    {
        string tooLong = new('x', AzureExtractorSubscriptionDisplayName.MaxStoredLength + 8);

        string? normalized = AzureExtractorSubscriptionDisplayName.Normalize(tooLong);

        normalized.Should().NotBeNull();
        normalized!.Length.Should().Be(AzureExtractorSubscriptionDisplayName.MaxStoredLength);
    }
}
