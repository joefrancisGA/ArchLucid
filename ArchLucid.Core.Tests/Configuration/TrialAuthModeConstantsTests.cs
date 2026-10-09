using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialAuthModeConstantsTests
{
    [Fact]
    public void HasMode_ignores_null_slots_from_configuration_binding()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    // JSON `["Modes": [null, "LocalIdentity"]]` and an explicit null index bind the same way.
                    [$"{TrialAuthOptions.SectionPath}:Modes:0"] = null,
                    [$"{TrialAuthOptions.SectionPath}:Modes:1"] = TrialAuthModeConstants.LocalIdentity,
                })
            .Build();

        TrialAuthOptions trial = configuration.GetSection(TrialAuthOptions.SectionPath).Get<TrialAuthOptions>()
            ?? throw new InvalidOperationException("Expected Auth:Trial to bind.");

        trial.Modes.Any(m => m is null).Should().BeTrue();
        TrialAuthModeConstants.HasMode(trial.Modes, TrialAuthModeConstants.LocalIdentity).Should().BeTrue();
        TrialAuthModeConstants.HasMode(trial.Modes, TrialAuthModeConstants.MsaExternalId).Should().BeFalse();
    }
}
