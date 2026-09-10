using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
public sealed class UnsupportedSemanticSupportFinalizeHoldEvaluatorTests
{
    [Fact]
    public void Applies_defaults_false_when_flag_off()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            PilotStrictHoldOnUnsupportedSemanticSupport = false,
        };

        UnsupportedSemanticSupportFinalizeHoldEvaluator
            .Applies(new ArchitectureRun { StructuralExecutionMode = StructuralExecutionMode.Real }, options)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void Applies_when_real_pilot_strict_and_flag_on()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            PilotStrictHoldOnUnsupportedSemanticSupport = true,
        };

        UnsupportedSemanticSupportFinalizeHoldEvaluator
            .Applies(new ArchitectureRun { StructuralExecutionMode = StructuralExecutionMode.Real }, options)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Applies_ignores_simulator_even_when_flag_on()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            PilotStrictHoldOnUnsupportedSemanticSupport = true,
        };

        UnsupportedSemanticSupportFinalizeHoldEvaluator
            .Applies(new ArchitectureRun { StructuralExecutionMode = StructuralExecutionMode.Simulator }, options)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void GetBlockingReasons_when_flag_on_and_unsupported_present_returns_reason()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            PilotStrictHoldOnUnsupportedSemanticSupport = true,
        };

        List<Finding> findings =
        [
            new Finding
            {
                FindingId = "f-1",
                SemanticSupportBand = FindingSemanticSupportBand.Unsupported,
                Classification = FindingClassification.DecisionGradeFinding,
            },
            new Finding
            {
                FindingId = "f-2",
                SemanticSupportBand = FindingSemanticSupportBand.Supported,
                Classification = FindingClassification.DecisionGradeFinding,
            },
        ];

        IReadOnlyList<string> reasons =
            UnsupportedSemanticSupportFinalizeHoldEvaluator.GetBlockingReasons(run, options, findings);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("Unsupported semantic support");
        reasons[0].Should().Contain("Count: 1");
    }

    [Fact]
    public void GetBlockingReasons_when_flag_off_returns_empty()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            PilotStrictHoldOnUnsupportedSemanticSupport = false,
        };

        UnsupportedSemanticSupportFinalizeHoldEvaluator
            .GetBlockingReasons(
                run,
                options,
                [new Finding { SemanticSupportBand = FindingSemanticSupportBand.Unsupported }])
            .Should()
            .BeEmpty();
    }
}
