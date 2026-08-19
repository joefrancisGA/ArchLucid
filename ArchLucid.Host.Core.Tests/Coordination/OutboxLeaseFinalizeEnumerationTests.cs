using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Coordination;

[Trait("Suite", "Core")]
public sealed class OutboxLeaseFinalizeEnumerationTests
{
    private static readonly DateTime BaseUtc = new(2026, 8, 17, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Exhaustive_single_step_events_on_fresh_model()
    {
        foreach (OutboxLeaseLifecycleEvent lifecycleEvent in Enum.GetValues<OutboxLeaseLifecycleEvent>())
        {
            OutboxLeaseFinalizeModel model = new();
            OutboxLeaseTransitionResult result = model.TryApply(lifecycleEvent, BaseUtc);

            if (lifecycleEvent is OutboxLeaseLifecycleEvent.Lease)
                result.IsAllowed.Should().BeTrue();
            else
                result.IsAllowed.Should().BeFalse();
        }
    }

    [Fact]
    public void Crash_then_resume_restores_running_lease()
    {
        OutboxLeaseFinalizeModel model = new();
        model.TryApply(OutboxLeaseLifecycleEvent.Lease, BaseUtc).IsAllowed.Should().BeTrue();
        model.TryApply(OutboxLeaseLifecycleEvent.Crash, BaseUtc).IsAllowed.Should().BeTrue();
        model.TryApply(OutboxLeaseLifecycleEvent.Resume, BaseUtc.AddSeconds(5)).IsAllowed.Should().BeTrue();

        model.LifecycleState.Should().Be(OutboxLeaseLifecycleState.Running);
        model.LeaseHeld.Should().BeTrue();
    }

    [Fact]
    public void Finalize_then_late_write_is_rejected()
    {
        OutboxLeaseFinalizeModel model = ReadyToFinalize();
        model.TryApply(OutboxLeaseLifecycleEvent.Finalize, BaseUtc.AddSeconds(10)).IsAllowed.Should().BeTrue();
        model.TryApply(OutboxLeaseLifecycleEvent.LateWrite, BaseUtc.AddSeconds(11)).IsAllowed.Should().BeFalse();
        model.FinalizeCount.Should().Be(1);
    }

    [Fact]
    public void Never_double_finalize()
    {
        OutboxLeaseFinalizeModel model = ReadyToFinalize();
        model.TryApply(OutboxLeaseLifecycleEvent.Finalize, BaseUtc).IsAllowed.Should().BeTrue();
        model.TryApply(OutboxLeaseLifecycleEvent.Finalize, BaseUtc.AddSeconds(1)).IsAllowed.Should().BeFalse();
    }

    [Fact]
    public void Lease_zombie_is_detectable_after_heartbeat_timeout()
    {
        OutboxLeaseFinalizeModel model = new();
        model.TryApply(OutboxLeaseLifecycleEvent.Lease, BaseUtc).IsAllowed.Should().BeTrue();

        model.IsLeaseZombie(BaseUtc.AddMinutes(2), TimeSpan.FromMinutes(1)).Should().BeTrue();
    }

    [Fact]
    public void Finalize_without_persist_before_llm_is_rejected()
    {
        OutboxLeaseFinalizeModel model = new();
        model.TryApply(OutboxLeaseLifecycleEvent.Lease, BaseUtc).IsAllowed.Should().BeTrue();
        model.MarkReadyForFinalize();

        model.TryApply(OutboxLeaseLifecycleEvent.Finalize, BaseUtc).IsAllowed.Should().BeFalse();
    }

    private static OutboxLeaseFinalizeModel ReadyToFinalize()
    {
        OutboxLeaseFinalizeModel model = new();
        model.TryApply(OutboxLeaseLifecycleEvent.Lease, BaseUtc).IsAllowed.Should().BeTrue();
        model.MarkPersistedBeforeLlm();
        model.MarkReadyForFinalize();
        return model;
    }
}
