using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class AgentOutputQualityGateOptionsTests
{
    [Fact]
    public void SectionPath_matches_configuration_key()
    {
        AgentOutputQualityGateOptions.SectionPath.Should().Be("ArchLucid:AgentOutput:QualityGate");
    }

    [Fact]
    public void Defaults_match_shipped_calibration()
    {
        AgentOutputQualityGateOptions o = new();

        o.Mode.Should().Be(AgentOutputQualityGateMode.WarnOnly);
        o.PilotStrictMinStructuralCompleteness.Should().Be(0.90);
        o.PilotStrictMinSemanticScore.Should().Be(0.50);
        o.PilotStrictMinEvidenceRefCount.Should().Be(2);
        o.PilotStrictMinFaithfulnessSupportRatio.Should().BeNull();
        o.PilotStrictMinAgentResultFaithfulnessSupportRatio.Should().BeNull();
        o.HeuristicEvaluatorTightenedThresholds.Should().BeFalse();
        o.Enabled.Should().BeTrue();
        o.StructuralWarnBelow.Should().Be(0.85);
        o.SemanticWarnBelow.Should().Be(0.65);
        o.StructuralRejectBelow.Should().Be(0.7);
        o.SemanticRejectBelow.Should().Be(0.5);
        o.PerAgentTypeFloors.Should().BeEmpty();
        o.EnforceOnReject.Should().BeFalse();
        o.BlockRunOnReject.Should().BeFalse();
        o.PersistPartialOutputsOnBudgetExceeded.Should().BeTrue();
        o.MaxTokensPerRun.Should().BeNull();
        o.MaxCostPerRun.Should().BeNull();
    }

    [Fact]
    public void All_properties_round_trip_for_binding_layer()
    {
        Dictionary<string, AgentTypeQualityFloors> perAgent =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["Topology"] = new AgentTypeQualityFloors
                {
                    StructuralWarnBelow = 0.81,
                    StructuralRejectBelow = 0.71,
                    SemanticWarnBelow = 0.60,
                    SemanticRejectBelow = 0.52,
                },
            };

        AgentOutputQualityGateOptions o = new()
        {
            Mode = AgentOutputQualityGateMode.PilotStrict,
            PilotStrictMinStructuralCompleteness = 0.95,
            PilotStrictMinSemanticScore = 0.55,
            PilotStrictMinEvidenceRefCount = 3,
            PilotStrictMinFaithfulnessSupportRatio = 0.82,
            PilotStrictMinAgentResultFaithfulnessSupportRatio = 0.65,
            HeuristicEvaluatorTightenedThresholds = true,
            Enabled = false,
            StructuralWarnBelow = 0.80,
            SemanticWarnBelow = 0.64,
            StructuralRejectBelow = 0.68,
            SemanticRejectBelow = 0.48,
            PerAgentTypeFloors = perAgent,
            EnforceOnReject = true,
            BlockRunOnReject = true,
            PersistPartialOutputsOnBudgetExceeded = false,
            MaxTokensPerRun = 5_000_000,
            MaxCostPerRun = 125.75m,
        };

        o.Mode.Should().Be(AgentOutputQualityGateMode.PilotStrict);
        o.PilotStrictMinStructuralCompleteness.Should().Be(0.95);
        o.PilotStrictMinSemanticScore.Should().Be(0.55);
        o.PilotStrictMinEvidenceRefCount.Should().Be(3);
        o.PilotStrictMinFaithfulnessSupportRatio.Should().Be(0.82);
        o.PilotStrictMinAgentResultFaithfulnessSupportRatio.Should().Be(0.65);
        o.HeuristicEvaluatorTightenedThresholds.Should().BeTrue();
        o.Enabled.Should().BeFalse();
        o.StructuralWarnBelow.Should().Be(0.80);
        o.SemanticWarnBelow.Should().Be(0.64);
        o.StructuralRejectBelow.Should().Be(0.68);
        o.SemanticRejectBelow.Should().Be(0.48);
        o.PerAgentTypeFloors.Should().BeSameAs(perAgent);
        o.EnforceOnReject.Should().BeTrue();
        o.BlockRunOnReject.Should().BeTrue();
        o.PersistPartialOutputsOnBudgetExceeded.Should().BeFalse();
        o.MaxTokensPerRun.Should().Be(5_000_000);
        o.MaxCostPerRun.Should().Be(125.75m);
        o.PerAgentTypeFloors["topology"].StructuralWarnBelow.Should().Be(0.81);
    }

    [Fact]
    public void PerAgentTypeFloors_dictionary_uses_case_insensitive_comparer_after_default_ctor()
    {
        AgentOutputQualityGateOptions o = new();

        o.PerAgentTypeFloors["Cost"] = new AgentTypeQualityFloors { SemanticRejectBelow = 0.41 };

        o.PerAgentTypeFloors.Should().ContainKeys("cost", "COST");
        o.PerAgentTypeFloors["cost"].SemanticRejectBelow.Should().Be(0.41);
    }

    [Fact]
    public void AgentTypeQualityFloors_properties_round_trip()
    {
        AgentTypeQualityFloors floors = new()
        {
            StructuralWarnBelow = 0.1,
            StructuralRejectBelow = 0.2,
            SemanticWarnBelow = 0.3,
            SemanticRejectBelow = 0.4,
        };

        floors.StructuralWarnBelow.Should().Be(0.1);
        floors.StructuralRejectBelow.Should().Be(0.2);
        floors.SemanticWarnBelow.Should().Be(0.3);
        floors.SemanticRejectBelow.Should().Be(0.4);
    }

    [Fact]
    public void AgentTypeQualityFloors_defaults_are_null_floor_fields()
    {
        AgentTypeQualityFloors floors = new();

        floors.StructuralWarnBelow.Should().BeNull();
        floors.StructuralRejectBelow.Should().BeNull();
        floors.SemanticWarnBelow.Should().BeNull();
        floors.SemanticRejectBelow.Should().BeNull();
    }
}
