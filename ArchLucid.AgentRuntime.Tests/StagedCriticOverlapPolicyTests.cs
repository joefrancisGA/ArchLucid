using ArchLucid.AgentRuntime;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StagedCriticOverlapPolicyTests
{
    [Fact]
    public void ShouldUseOverlap_false_when_overlap_disabled()
    {
        StagedCriticAgentOptions staged = new()
        {
            StagedCriticEnabled = true,
            StagedCriticOverlapEnabled = false,
        };

        bool result = StagedCriticOverlapPolicy.ShouldUseOverlap(staged, new AgentOutputQualityGateOptions());

        result.Should().BeFalse();
    }

    [Fact]
    public void ShouldUseOverlap_true_when_overlap_enabled_and_quality_gate_warn_only()
    {
        StagedCriticAgentOptions staged = new()
        {
            StagedCriticEnabled = true,
            StagedCriticOverlapEnabled = true,
        };

        AgentOutputQualityGateOptions quality = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.WarnOnly,
            EnforceOnReject = false,
            BlockRunOnReject = false,
        };

        bool result = StagedCriticOverlapPolicy.ShouldUseOverlap(staged, quality);

        result.Should().BeTrue();
    }

    [Fact]
    public void ShouldUseOverlap_false_when_pilot_strict_enforce_on()
    {
        StagedCriticAgentOptions staged = new()
        {
            StagedCriticEnabled = true,
            StagedCriticOverlapEnabled = true,
        };

        AgentOutputQualityGateOptions quality = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            EnforceOnReject = true,
            PilotStrictMinAgentResultFaithfulnessSupportRatio = 0.5,
            PilotStrictMinFaithfulnessSupportRatio = 0.5,
            PilotStrictMinEvidenceRefCount = 2,
        };

        bool result = StagedCriticOverlapPolicy.ShouldUseOverlap(staged, quality);

        result.Should().BeFalse();
    }

    [Fact]
    public void ResolvePhase1MaxConcurrentHandlers_reserves_one_slot_when_bulkhead_gt_one()
    {
        StagedCriticAgentOptions staged = new()
        {
            StagedCriticEnabled = true,
            StagedCriticOverlapEnabled = true,
        };

        int cap = StagedCriticOverlapPolicy.ResolvePhase1MaxConcurrentHandlers(staged, bulkheadMaxConcurrentHandlers: 8);

        cap.Should().Be(7);
    }

    [Fact]
    public void ResolvePhase1MaxConcurrentHandlers_honors_explicit_override()
    {
        StagedCriticAgentOptions staged = new()
        {
            StagedCriticEnabled = true,
            StagedCriticOverlapEnabled = true,
            Phase1MaxConcurrentHandlers = 3,
        };

        int cap = StagedCriticOverlapPolicy.ResolvePhase1MaxConcurrentHandlers(staged, bulkheadMaxConcurrentHandlers: 8);

        cap.Should().Be(3);
    }
}
