using ArchLucid.Core.Agents;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Agents;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentModelExecutionProfileParserTests
{
    [Theory]
    [InlineData("HighAssurance")]
    [InlineData("high-assurance")]
    [InlineData("high assurance")]
    [InlineData("high_assurance")]
    [InlineData("High Assurance")]
    public void TryParse_accepts_high_assurance_display_labels(string raw)
    {
        bool ok = AgentModelExecutionProfileParser.TryParse(raw, out AgentModelExecutionProfile profile);

        ok.Should().BeTrue();
        profile.Should().Be(AgentModelExecutionProfile.HighAssurance);
    }

    [Fact]
    public void TryParse_accepts_string_encoded_whole_number_high_assurance_ordinal()
    {
        bool ok = AgentModelExecutionProfileParser.TryParse("2.0", out AgentModelExecutionProfile profile);

        ok.Should().BeTrue();
        profile.Should().Be(AgentModelExecutionProfile.HighAssurance);
    }

    [Fact]
    public void TryParse_rejects_string_encoded_boolean_balanced_ordinal()
    {
        bool ok = AgentModelExecutionProfileParser.TryParse("True", out AgentModelExecutionProfile profile);

        ok.Should().BeFalse();
    }

    [Fact]
    public void TryParse_rejects_string_encoded_boolean_economy_ordinal()
    {
        bool ok = AgentModelExecutionProfileParser.TryParse("False", out AgentModelExecutionProfile profile);

        ok.Should().BeFalse();
    }

    [Fact]
    public void TryParse_rejects_on_synonym_balanced_ordinal()
    {
        bool ok = AgentModelExecutionProfileParser.TryParse("on", out AgentModelExecutionProfile profile);

        ok.Should().BeFalse();
    }
}
