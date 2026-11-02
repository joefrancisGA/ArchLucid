using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
public sealed class PercentDecodeBoundedTests
{
    [Fact]
    public void Decode_plain_value_is_returned_unchanged()
    {
        PercentDecodeBounded.Decode("plain-value").Should().Be("plain-value");
    }

    [Fact]
    public void Decode_unwraps_multiple_encoding_layers()
    {
        string once = Uri.EscapeDataString("/subscriptions/sub/resourceGroups/rg");
        string twice = Uri.EscapeDataString(once);

        PercentDecodeBounded.Decode(twice).Should().Be("/subscriptions/sub/resourceGroups/rg");
    }

    [Fact]
    public void Decode_malformed_percent_encoding_keeps_last_working_value()
    {
        PercentDecodeBounded.Decode("value%ZZtail").Should().Be("value%ZZtail");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Decode_rejects_non_positive_max_passes(int maxPasses)
    {
        Action act = () => PercentDecodeBounded.Decode("value", maxPasses);

        act.Should().Throw<ArgumentOutOfRangeException>()
            .Which.ParamName.Should().Be("maxPasses");
    }

    [Fact]
    public void Decode_with_one_max_pass_leaves_a_second_encoding_layer()
    {
        string once = Uri.EscapeDataString("value");
        string twice = Uri.EscapeDataString(once);

        PercentDecodeBounded.Decode(twice, maxPasses: 1).Should().Be(once);
    }

    [Fact]
    public void Decode_stops_at_max_passes()
    {
        string encoded = "x";
        for (int layer = 0; layer < 12; layer++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string expected = encoded;
        for (int pass = 0; pass < 8; pass++)
        {
            expected = Uri.UnescapeDataString(expected);
        }

        PercentDecodeBounded.Decode(encoded).Should().Be(expected);
    }
}
