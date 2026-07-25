using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanPublicCapacityStateResolverTests
{
    private static QuickScanSafetyOptions EnabledSafetyOptions() => new()
    {
        Enabled = true,
        AnonymousExecutionEnabled = true,
        SampleFallbackEnabled = true,
    };

    [Fact]
    public void Resolve_sample_only_mode_blocks_ai_execution()
    {
        QuickScanSafetyOperationalSnapshot operational = new()
        {
            Mode = QuickScanSafetyOperationalMode.SampleOnly,
            AnonymousExecutionAllowed = false,
            SampleResultAvailable = true,
            PublicMessage = "Sample only.",
            StoreHealthy = true,
        };

        QuickScanPublicCapacityStateResolver.Resolution resolution =
            QuickScanPublicCapacityStateResolver.Resolve(
                operational,
                QuickScanGuardDecision.Permit(),
                EnabledSafetyOptions());

        resolution.State.Should().Be(QuickScanPublicCapacityState.SampleOnly);
        resolution.AiExecutionAllowed.Should().BeFalse();
        resolution.SampleResultAvailable.Should().BeTrue();
    }

    [Fact]
    public void Resolve_guard_budget_ceiling_maps_to_demonstration_capacity()
    {
        QuickScanPublicCapacityStateResolver.Resolution resolution =
            QuickScanPublicCapacityStateResolver.Resolve(
                QuickScanSafetyOperationalSnapshot.NormalExecution(EnabledSafetyOptions()),
                QuickScanGuardDecision.Reject(QuickScanGuardRejectionReason.GlobalDailySpendCeiling),
                EnabledSafetyOptions());

        resolution.State.Should().Be(QuickScanPublicCapacityState.DemonstrationCapacity);
        resolution.AiExecutionAllowed.Should().BeFalse();
    }

    [Fact]
    public void Resolve_available_when_operational_and_guard_allow()
    {
        QuickScanPublicCapacityStateResolver.Resolution resolution =
            QuickScanPublicCapacityStateResolver.Resolve(
                QuickScanSafetyOperationalSnapshot.NormalExecution(EnabledSafetyOptions()),
                QuickScanGuardDecision.Permit(),
                EnabledSafetyOptions());

        resolution.State.Should().Be(QuickScanPublicCapacityState.Available);
        resolution.AiExecutionAllowed.Should().BeTrue();
    }
}
