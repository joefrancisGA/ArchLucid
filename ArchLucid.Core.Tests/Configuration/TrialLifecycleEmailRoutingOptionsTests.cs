using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialLifecycleEmailRoutingOptionsTests
{
    [Theory]
    [InlineData("LogicApp", true)]
    [InlineData("logicapp", true)]
    [InlineData(" LogicApp ", true)]
    [InlineData("Hosted", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsLogicAppOwnerMode_matches_logic_app_token_only(string? owner, bool expected)
    {
        bool actual = TrialLifecycleEmailRoutingOptions.IsLogicAppOwnerMode(owner);

        actual.Should().Be(expected);
    }

    [Fact]
    public void IsLogicAppOwned_true_when_owner_logic_app()
    {
        TrialLifecycleEmailRoutingOptions options = new()
        {
            Owner = TrialLifecycleEmailRoutingOptions.OwnerModes.LogicApp
        };

        options.IsLogicAppOwned().Should().BeTrue();
    }

    [Fact]
    public void IsLogicAppOwned_false_when_owner_hosted()
    {
        TrialLifecycleEmailRoutingOptions options = new()
        {
            Owner = TrialLifecycleEmailRoutingOptions.OwnerModes.Hosted
        };

        options.IsLogicAppOwned().Should().BeFalse();
    }

    [Fact]
    public void IsLogicAppOwned_false_when_owner_whitespace()
    {
        TrialLifecycleEmailRoutingOptions options = new() { Owner = "   " };

        options.IsLogicAppOwned().Should().BeFalse();
    }

    [Fact]
    public void IsLogicAppOwned_false_when_configuration_binds_owner_null()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    // JSON `"Owner": null` binds over the Hosted initializer.
                    [$"{TrialLifecycleEmailRoutingOptions.OwnerConfigurationKey}"] = null,
                })
            .Build();
        TrialLifecycleEmailRoutingOptions options = new();
        configuration.GetSection(TrialLifecycleEmailRoutingOptions.SectionName).Bind(options);

        options.Owner.Should().BeNull();
        options.IsLogicAppOwned().Should().BeFalse();
    }
}
