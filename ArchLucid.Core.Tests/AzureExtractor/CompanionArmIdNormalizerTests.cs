using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Suite", "Core")]
public sealed class CompanionArmIdNormalizerTests
{
    [Fact]
    public void Normalize_plain_arm_id_is_lowercased_and_trailing_slash_stripped()
    {
        CompanionArmIdNormalizer.Normalize("/Subscriptions/Sub/ResourceGroups/RG/")
            .Should().Be("/subscriptions/sub/resourcegroups/rg");
    }

    [Fact]
    public void Normalize_percent_encoded_arm_id_is_decoded_then_normalized()
    {
        string encoded = Uri.EscapeDataString("/Subscriptions/Sub/resourceGroups/RG/providers/Microsoft.Sql/servers/S");

        CompanionArmIdNormalizer.Normalize(encoded)
            .Should().Be("/subscriptions/sub/resourcegroups/rg/providers/microsoft.sql/servers/s");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Normalize_null_empty_or_whitespace_returns_empty(string? armId)
    {
        CompanionArmIdNormalizer.Normalize(armId).Should().Be(string.Empty);
    }
}
