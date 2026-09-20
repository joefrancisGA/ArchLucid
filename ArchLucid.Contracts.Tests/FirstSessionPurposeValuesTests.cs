using ArchLucid.Contracts.User;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

public sealed class FirstSessionPurposeValuesTests
{
    [Fact]
    public void NormalizeOrNull_rejects_unknown_values()
    {
        FirstSessionPurposeValues.NormalizeOrNull(null).Should().BeNull();
        FirstSessionPurposeValues.NormalizeOrNull("").Should().BeNull();
        FirstSessionPurposeValues.NormalizeOrNull("practice").Should().BeNull();
    }

    [Fact]
    public void NormalizeOrNull_accepts_live_and_training()
    {
        FirstSessionPurposeValues.NormalizeOrNull("LIVE").Should().Be(FirstSessionPurposeValues.Live);
        FirstSessionPurposeValues.NormalizeOrNull("Training").Should().Be(FirstSessionPurposeValues.Training);
    }

    [Fact]
    public void IsExplicitValue_matches_normalized_tokens()
    {
        FirstSessionPurposeValues.IsExplicitValue("live").Should().BeTrue();
        FirstSessionPurposeValues.IsExplicitValue("training").Should().BeTrue();
        FirstSessionPurposeValues.IsExplicitValue(null).Should().BeFalse();
    }
}
