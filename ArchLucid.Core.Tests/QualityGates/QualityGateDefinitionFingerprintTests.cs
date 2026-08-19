using ArchLucid.Core.Configuration;
using ArchLucid.Core.QualityGates;
using FluentAssertions;

namespace ArchLucid.Core.Tests.QualityGates;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class QualityGateDefinitionFingerprintTests
{
    [Fact]
    public void ComputeFromOptions_is_stable_for_default_options()
    {
        AgentOutputQualityGateOptions options = new();

        string first = QualityGateDefinitionFingerprint.ComputeFromOptions(options);
        string second = QualityGateDefinitionFingerprint.ComputeFromOptions(options);

        first.Should().Be(second);
        first.Should().MatchRegex("^[a-f0-9]{64}$");
    }

    [Fact]
    public void ComputeFromOptions_changes_when_threshold_floor_changes()
    {
        AgentOutputQualityGateOptions baseline = new();
        AgentOutputQualityGateOptions tightened = new() { SemanticRejectBelow = baseline.SemanticRejectBelow - 0.01 };

        QualityGateDefinitionFingerprint.ComputeFromOptions(baseline)
            .Should()
            .NotBe(QualityGateDefinitionFingerprint.ComputeFromOptions(tightened));
    }

    [Fact]
    public void ComputeFromOptions_is_insensitive_to_per_agent_dictionary_order()
    {
        AgentOutputQualityGateOptions first = new()
        {
            PerAgentTypeFloors =
            {
                ["Topology"] = new AgentTypeQualityFloors { SemanticRejectBelow = 0.42 },
                ["Cost"] = new AgentTypeQualityFloors { SemanticRejectBelow = 0.41 },
            },
        };

        AgentOutputQualityGateOptions second = new()
        {
            PerAgentTypeFloors =
            {
                ["Cost"] = new AgentTypeQualityFloors { SemanticRejectBelow = 0.41 },
                ["Topology"] = new AgentTypeQualityFloors { SemanticRejectBelow = 0.42 },
            },
        };

        QualityGateDefinitionFingerprint.ComputeFromOptions(first)
            .Should()
            .Be(QualityGateDefinitionFingerprint.ComputeFromOptions(second));
    }

    [Fact]
    public void ComputeFromOptions_ignores_enforcement_orchestration_fields()
    {
        AgentOutputQualityGateOptions baseline = new();
        AgentOutputQualityGateOptions orchestrationOnly = new()
        {
            EnforceOnReject = !baseline.EnforceOnReject,
            BlockRunOnReject = !baseline.BlockRunOnReject,
            MaxAutoRetries = baseline.MaxAutoRetries + 3,
            MaxTokensPerRun = 99_999,
            MaxCostPerRun = 12.34m,
        };

        QualityGateDefinitionFingerprint.ComputeFromOptions(baseline)
            .Should()
            .Be(QualityGateDefinitionFingerprint.ComputeFromOptions(orchestrationOnly));
    }
}
