using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

public sealed class GovernanceEnvironmentOrderTests
{
    [Theory]
    [InlineData(GovernanceEnvironment.Dev, GovernanceEnvironment.Test, true)]
    [InlineData(GovernanceEnvironment.Test, GovernanceEnvironment.Prod, true)]
    [InlineData(GovernanceEnvironment.Dev, GovernanceEnvironment.Prod, false)]
    [InlineData(GovernanceEnvironment.Test, GovernanceEnvironment.Dev, false)]
    [InlineData(GovernanceEnvironment.Prod, GovernanceEnvironment.Test, false)]
    [InlineData("DEV", "test", true)]
    [InlineData("Test", "PROD", true)]
    public void IsValidPromotion_MatchesExpected(string source, string target, bool expected)
    {
        GovernanceEnvironmentOrder.IsValidPromotion(source, target).Should().Be(expected);
    }

    [Fact]
    public void IsValidPromotion_EmptySource_ReturnsFalse()
    {
        GovernanceEnvironmentOrder.IsValidPromotion("", GovernanceEnvironment.Test).Should().BeFalse();
    }
}
