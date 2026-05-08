using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOutputQualityGateTests
{
    private static AgentOutputQualityGateOptions BuildOptionsWithLockedPerAgentRejectFloorsAndLooseGlobal()
    {
        return new AgentOutputQualityGateOptions
        {
            Enabled = true,
            StructuralRejectBelow = 0.01,
            SemanticRejectBelow = 0.01,
            StructuralWarnBelow = 1.0,
            SemanticWarnBelow = 1.0,
            PerAgentTypeFloors =
            {
                ["Topology"] = new AgentTypeQualityFloors
                {
                    StructuralRejectBelow = 0.85,
                    SemanticRejectBelow = 0.65,
                },
                ["Compliance"] = new AgentTypeQualityFloors
                {
                    StructuralRejectBelow = 0.8,
                    SemanticRejectBelow = 0.6,
                },
                ["Cost"] = new AgentTypeQualityFloors
                {
                    StructuralRejectBelow = 0.75,
                    SemanticRejectBelow = 0.55,
                },
                ["Critic"] = new AgentTypeQualityFloors
                {
                    StructuralRejectBelow = 0.65,
                    SemanticRejectBelow = 0.5,
                },
            },
        };
    }

    private static AgentOutputEvaluationScore Structural(AgentType agentType, double ratio)
    {
        return new AgentOutputEvaluationScore
        {
            TraceId = "t",
            AgentType = agentType,
            StructuralCompletenessRatio = ratio,
            IsJsonParseFailure = false
        };
    }

    private static AgentOutputSemanticScore Semantic(AgentType agentType, double overall)
    {
        return new AgentOutputSemanticScore
        {
            TraceId = "t",
            AgentType = agentType,
            OverallSemanticScore = overall
        };
    }

    [SkippableFact]
    public void Evaluate_when_disabled_always_accepts()
    {
        AgentOutputQualityGate sut = new(Options.Create(new AgentOutputQualityGateOptions { Enabled = false }));

        AgentOutputQualityGateOutcome o = sut.Evaluate(Structural(AgentType.Topology, 0.1), Semantic(AgentType.Topology, 0.1));

        o.Should().Be(AgentOutputQualityGateOutcome.Accepted);
    }

    [SkippableFact]
    public void Evaluate_rejects_when_structural_below_default_reject_floor()
    {
        AgentOutputQualityGate sut = new(Options.Create(new AgentOutputQualityGateOptions()));

        sut.Evaluate(Structural(AgentType.Topology, 0.69), Semantic(AgentType.Topology, 0.9))
            .Should().Be(AgentOutputQualityGateOutcome.Rejected);
    }

    [SkippableFact]
    public void Evaluate_rejects_when_semantic_below_default_reject_floor()
    {
        AgentOutputQualityGate sut = new(Options.Create(new AgentOutputQualityGateOptions()));

        sut.Evaluate(Structural(AgentType.Topology, 0.95), Semantic(AgentType.Topology, 0.49))
            .Should().Be(AgentOutputQualityGateOutcome.Rejected);
    }

    [SkippableFact]
    public void Evaluate_warns_when_above_reject_but_below_warn_on_either_score()
    {
        AgentOutputQualityGate sut = new(Options.Create(new AgentOutputQualityGateOptions()));

        sut.Evaluate(Structural(AgentType.Topology, 0.75), Semantic(AgentType.Topology, 0.55))
            .Should().Be(AgentOutputQualityGateOutcome.Warned);
    }

    [SkippableFact]
    public void Evaluate_accepts_when_at_or_above_default_warn_thresholds()
    {
        AgentOutputQualityGate sut = new(Options.Create(new AgentOutputQualityGateOptions()));

        sut.Evaluate(Structural(AgentType.Topology, 0.85), Semantic(AgentType.Topology, 0.65))
            .Should().Be(AgentOutputQualityGateOutcome.Accepted);
    }

    [SkippableFact]
    public void Evaluate_uses_per_agent_type_reject_floor_override()
    {
        AgentOutputQualityGate sut = new(Options.Create(new AgentOutputQualityGateOptions
        {
            PerAgentTypeFloors =
            {
                ["Topology"] = new AgentTypeQualityFloors { StructuralRejectBelow = 0.05 }
            }
        }));

        sut.Evaluate(Structural(AgentType.Topology, 0.1), Semantic(AgentType.Topology, 0.8))
            .Should().Be(AgentOutputQualityGateOutcome.Warned);
    }

    [SkippableFact]
    public void Evaluate_rejects_when_structural_below_reject_floor()
    {
        AgentOutputQualityGate sut = new(Options.Create(new AgentOutputQualityGateOptions
        {
            Enabled = true,
            StructuralRejectBelow = 0.35,
            SemanticRejectBelow = 0.35,
            StructuralWarnBelow = 0.55,
            SemanticWarnBelow = 0.55
        }));

        sut.Evaluate(Structural(AgentType.Topology, 0.34), Semantic(AgentType.Topology, 0.9))
            .Should().Be(AgentOutputQualityGateOutcome.Rejected);
    }

    [SkippableFact]
    public void Evaluate_warns_when_scores_below_warn_but_above_reject_with_explicit_floors()
    {
        AgentOutputQualityGate sut = new(Options.Create(new AgentOutputQualityGateOptions
        {
            Enabled = true,
            StructuralRejectBelow = 0.35,
            SemanticRejectBelow = 0.35,
            StructuralWarnBelow = 0.55,
            SemanticWarnBelow = 0.55
        }));

        sut.Evaluate(Structural(AgentType.Topology, 0.5), Semantic(AgentType.Topology, 0.5))
            .Should().Be(AgentOutputQualityGateOutcome.Warned);
    }

    [SkippableFact]
    public void Evaluate_accepts_when_at_or_above_explicit_warn_thresholds()
    {
        AgentOutputQualityGate sut = new(Options.Create(new AgentOutputQualityGateOptions
        {
            Enabled = true,
            StructuralRejectBelow = 0.35,
            SemanticRejectBelow = 0.35,
            StructuralWarnBelow = 0.55,
            SemanticWarnBelow = 0.55
        }));

        sut.Evaluate(Structural(AgentType.Topology, 0.56), Semantic(AgentType.Topology, 0.56))
            .Should().Be(AgentOutputQualityGateOutcome.Accepted);
    }

    [SkippableFact]
    public void Evaluate_per_agent_missing_from_map_uses_global_reject_floors()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            StructuralRejectBelow = 0.4,
            SemanticRejectBelow = 0.4,
            StructuralWarnBelow = 0.4,
            SemanticWarnBelow = 0.4,
            PerAgentTypeFloors =
            {
                ["Topology"] = new AgentTypeQualityFloors
                {
                    StructuralRejectBelow = 0.85,
                    SemanticRejectBelow = 0.65,
                },
            },
        };

        AgentOutputQualityGate sut = new(Options.Create(options));

        sut.Evaluate(Structural(AgentType.Cost, 0.35), Semantic(AgentType.Cost, 0.9))
            .Should().Be(AgentOutputQualityGateOutcome.Rejected);

        sut.Evaluate(Structural(AgentType.Cost, 0.5), Semantic(AgentType.Cost, 0.9))
            .Should().Be(AgentOutputQualityGateOutcome.Accepted);

        sut.Evaluate(Structural(AgentType.Topology, 0.5), Semantic(AgentType.Topology, 0.9))
            .Should().Be(AgentOutputQualityGateOutcome.Rejected);
    }

    [SkippableTheory]
    [InlineData(AgentType.Topology, 0.85, 0.65, false)]
    [InlineData(AgentType.Topology, 0.85, 0.65, true)]
    [InlineData(AgentType.Compliance, 0.8, 0.6, false)]
    [InlineData(AgentType.Compliance, 0.8, 0.6, true)]
    [InlineData(AgentType.Cost, 0.75, 0.55, false)]
    [InlineData(AgentType.Cost, 0.75, 0.55, true)]
    [InlineData(AgentType.Critic, 0.65, 0.5, false)]
    [InlineData(AgentType.Critic, 0.65, 0.5, true)]
    public void Evaluate_locked_hosted_per_agent_reject_floors_reject_strictly_below(
        AgentType agentType,
        double structuralRejectBelow,
        double semanticRejectBelow,
        bool semanticDimension)
    {
        AgentOutputQualityGate sut =
            new(Options.Create(BuildOptionsWithLockedPerAgentRejectFloorsAndLooseGlobal()));

        if (semanticDimension)
        {
            sut.Evaluate(Structural(agentType, 1.0), Semantic(agentType, semanticRejectBelow - 0.01))
                .Should().Be(AgentOutputQualityGateOutcome.Rejected);
        }
        else
        {
            sut.Evaluate(Structural(agentType, structuralRejectBelow - 0.01), Semantic(agentType, 1.0))
                .Should().Be(AgentOutputQualityGateOutcome.Rejected);
        }
    }

    [SkippableFact]
    public void EnforceOnReject_defaults_to_false()
    {
        AgentOutputQualityGateOptions options = new();

        options.EnforceOnReject.Should().BeFalse("default must be false so existing behaviour is preserved");
    }

    [SkippableFact]
    public void Mode_defaults_to_warn_only()
    {
        new AgentOutputQualityGateOptions().Mode.Should().Be(AgentOutputQualityGateMode.WarnOnly);
    }
}
