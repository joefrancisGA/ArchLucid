using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class AgentOutputQualityGateOptionsValidatorTests
{
    private readonly AgentOutputQualityGateOptionsValidator _sut = new();

    [Fact]
    public void Validate_pilot_strict_without_agent_result_faithfulness_floor_fails()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Mode = AgentOutputQualityGateMode.PilotStrict,
            PilotStrictMinAgentResultFaithfulnessSupportRatio = null,
        };

        ValidateOptionsResult r = _sut.Validate(Options.DefaultName, options);

        r.Failed.Should().BeTrue();
        r.Failures.Should().ContainSingle();
        r.Failures.Should().Contain(f => f.Contains("PilotStrictMinAgentResultFaithfulnessSupportRatio", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_pilot_strict_with_floor_succeeds()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Mode = AgentOutputQualityGateMode.PilotStrict,
            PilotStrictMinAgentResultFaithfulnessSupportRatio = 0.7,
        };

        ValidateOptionsResult r = _sut.Validate(Options.DefaultName, options);

        r.Succeeded.Should().BeTrue();
    }

    [Fact]
    public void Validate_warn_only_with_null_agent_result_faithfulness_succeeds()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Mode = AgentOutputQualityGateMode.WarnOnly,
            PilotStrictMinAgentResultFaithfulnessSupportRatio = null,
        };

        ValidateOptionsResult r = _sut.Validate(Options.DefaultName, options);

        r.Succeeded.Should().BeTrue();
    }
}
