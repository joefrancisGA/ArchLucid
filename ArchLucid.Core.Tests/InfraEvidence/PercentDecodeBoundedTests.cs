using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
public sealed class PercentDecodeBoundedTests
{
    [Theory]
    [InlineData("/subscriptions/abc", "/subscriptions/abc")]
    [InlineData("%2Fsubscriptions%2Fabc", "/subscriptions/abc")]
    [InlineData("%252Fsubscriptions%252Fabc", "/subscriptions/abc")]
    [InlineData("%25252Fsubscriptions%25252Fabc", "/subscriptions/abc")]
    public void Decode_unwraps_repeated_percent_encoding(string input, string expected)
    {
        PercentDecodeBounded.Decode(input).Should().Be(expected);
    }

    [Fact]
    public void Decode_stops_when_a_pass_makes_no_progress()
    {
        PercentDecodeBounded.Decode("%25").Should().Be("%");
    }

    [Fact]
    public void Decode_stops_at_the_pass_cap_for_adversarial_input()
    {
        string input = "/subscriptions/abc";

        for (int i = 0; i < PercentDecodeBounded.MaxPasses + 4; i++)
        {
            input = Uri.EscapeDataString(input);
        }

        string decoded = PercentDecodeBounded.Decode(input);

        decoded.Should().Contain("%");
        decoded.Length.Should().BeLessThan(input.Length);
    }
}
