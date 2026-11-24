using ArchLucid.Core.Resilience;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
/// Deterministic tests for <see cref="CircuitBreakerGate"/> using an injectable clock.
/// </summary>
[Trait("Category", "Unit")]
public sealed class CircuitBreakerGateTests
{
    [Fact]
    public void Closed_after_threshold_failures_opens_on_next_failure()
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 3,
            DurationOfBreakSeconds = 10
        };
        CircuitBreakerGate gate = new("test-gate", options, clock.ToFunc());

        gate.ThrowIfBroken();
        gate.RecordFailure();
        gate.ThrowIfBroken();
        gate.RecordFailure();
        gate.ThrowIfBroken();
        gate.RecordFailure();

        Action act = () => gate.ThrowIfBroken();

        act.Should().Throw<CircuitBreakerOpenException>();
    }

    [Fact]
    public void Open_after_duration_allows_single_probe_then_closes_on_success()
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 1,
            DurationOfBreakSeconds = 30
        };
        CircuitBreakerGate gate = new("test-gate", options, clock.ToFunc());

        gate.ThrowIfBroken();
        gate.RecordFailure();
        Action whileOpen = () => gate.ThrowIfBroken();
        whileOpen.Should().Throw<CircuitBreakerOpenException>();

        clock.Advance(TimeSpan.FromSeconds(31));
        gate.ThrowIfBroken();
        gate.RecordSuccess();
        gate.ThrowIfBroken();
    }

    [Fact]
    public void Half_open_failure_reopens_circuit()
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 1,
            DurationOfBreakSeconds = 30
        };
        CircuitBreakerGate gate = new("test-gate", options, clock.ToFunc());

        gate.RecordFailure();
        clock.Advance(TimeSpan.FromSeconds(31));
        gate.ThrowIfBroken();
        gate.RecordFailure();

        Action act = () => gate.ThrowIfBroken();

        act.Should().Throw<CircuitBreakerOpenException>();
    }

    [Fact]
    public void Half_open_requires_configured_success_streak_before_closing()
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 1,
            DurationOfBreakSeconds = 30,
            HalfOpenSuccessThreshold = 2
        };
        CircuitBreakerGate gate = new("test-gate", options, clock.ToFunc());

        gate.RecordFailure();
        clock.Advance(TimeSpan.FromSeconds(31));
        gate.ThrowIfBroken();
        gate.RecordSuccess();
        gate.CurrentState.Should().Be("HalfOpen");
        gate.LastOpenReason.Should().Be("consecutive_failures");

        gate.ThrowIfBroken();
        gate.RecordSuccess();
        gate.CurrentState.Should().Be("Closed");
        gate.LastOpenReason.Should().BeNull();
    }

    [Fact]
    public void Half_open_success_streak_reserves_each_subsequent_probe_slot()
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("half-open-success-streak",
            new CircuitBreakerOptions
            {
                FailureThreshold = 1,
                DurationOfBreakSeconds = 30,
                HalfOpenSuccessThreshold = 2
            }, clock.ToFunc());

        gate.RecordFailure();
        clock.Advance(TimeSpan.FromSeconds(31));
        gate.ThrowIfBroken();
        gate.RecordSuccess();
        gate.CurrentState.Should().Be("HalfOpen");

        // One next probe may enter; a concurrent request must still be rejected.
        gate.ThrowIfBroken();
        Action concurrentRequest = () => gate.ThrowIfBroken();
        concurrentRequest.Should().Throw<CircuitBreakerOpenException>();
        gate.CurrentState.Should().Be("HalfOpen");

        gate.RecordSuccess();
        gate.CurrentState.Should().Be("Closed");
        gate.ThrowIfBroken();
    }

    [Fact]
    public void Latency_brownout_recovers_after_break_without_manual_reset()
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 3,
            DurationOfBreakSeconds = 20,
            HalfOpenSuccessThreshold = 1
        };
        CircuitBreakerGate gate = new("test-gate", options, clock.ToFunc());

        for (int i = 0; i < 3; i++)
        {
            gate.ThrowIfBroken();
            gate.RecordFailure();
        }

        Action whileOpen = () => gate.ThrowIfBroken();
        whileOpen.Should().Throw<CircuitBreakerOpenException>();
        gate.LastOpenReason.Should().Be("consecutive_failures");

        clock.Advance(TimeSpan.FromSeconds(21));
        gate.ThrowIfBroken();
        gate.RecordSuccess();

        gate.CurrentState.Should().Be("Closed");
        gate.ThrowIfBroken();
    }

    [Fact]
    public async Task Concurrent_second_ThrowIfBroken_while_probe_in_flight_rejected()
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 1,
            DurationOfBreakSeconds = 60
        };
        CircuitBreakerGate gate = new("test-gate", options, clock.ToFunc());

        gate.RecordFailure();
        clock.Advance(TimeSpan.FromMinutes(2));
        gate.ThrowIfBroken();

        Task<bool> secondCaller = Task.Run(() =>
        {
            try
            {
                gate.ThrowIfBroken();
                return false;
            }
            catch (CircuitBreakerOpenException)
            {
                return true;
            }
        });

        bool rejected = await secondCaller;

        rejected.Should().BeTrue();
        gate.RecordSuccess();
    }

    [Fact]
    public void RecordCallCancelled_releases_probe_and_allows_immediate_retry_window()
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerOptions options = new()
        {
            FailureThreshold = 1,
            DurationOfBreakSeconds = 60
        };
        CircuitBreakerGate gate = new("test-gate", options, clock.ToFunc());

        gate.RecordFailure();
        clock.Advance(TimeSpan.FromMinutes(2));
        gate.ThrowIfBroken();
        gate.RecordCallCancelled();

        gate.ThrowIfBroken();
        gate.RecordSuccess();
    }

    [Fact]
    public void Stale_closed_call_success_does_not_close_open_circuit()
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("admission-generation", new CircuitBreakerOptions
        {
            FailureThreshold = 1,
            DurationOfBreakSeconds = 30
        }, clock.ToFunc());

        CircuitBreakerGate.CallAdmission failing = gate.Admit();
        CircuitBreakerGate.CallAdmission stale = gate.Admit();
        failing.RecordFailure();
        stale.RecordSuccess();

        gate.CurrentState.Should().Be("Open");
        Action rejected = () => gate.Admit();
        rejected.Should().Throw<CircuitBreakerOpenException>();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public void Stale_closed_outcome_cannot_mutate_new_half_open_probe(int outcome)
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("admission-generation", new CircuitBreakerOptions
        {
            FailureThreshold = 1,
            DurationOfBreakSeconds = 30
        }, clock.ToFunc());

        CircuitBreakerGate.CallAdmission failing = gate.Admit();
        CircuitBreakerGate.CallAdmission stale = gate.Admit();
        stale.IsHalfOpenProbe.Should().BeFalse();
        failing.RecordFailure();

        clock.Advance(TimeSpan.FromSeconds(31));
        CircuitBreakerGate.CallAdmission probe = gate.Admit();
        probe.IsHalfOpenProbe.Should().BeTrue();

        if (outcome == 0)
            stale.RecordSuccess();
        else if (outcome == 1)
            stale.RecordFailure();
        else
            stale.RecordCallCancelled();

        gate.CurrentState.Should().Be("HalfOpen");
        Action rejected = () => gate.Admit();
        rejected.Should().Throw<CircuitBreakerOpenException>();
        probe.RecordSuccess();
        gate.CurrentState.Should().Be("Closed");
    }

    [Fact]
    public void Admission_outcomes_are_single_use_during_multi_probe_recovery()
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("admission-generation", new CircuitBreakerOptions
        {
            FailureThreshold = 1,
            DurationOfBreakSeconds = 30,
            HalfOpenSuccessThreshold = 2
        }, clock.ToFunc());

        gate.Admit().RecordFailure();
        clock.Advance(TimeSpan.FromSeconds(31));
        CircuitBreakerGate.CallAdmission first = gate.Admit();
        first.RecordSuccess();
        CircuitBreakerGate.CallAdmission second = gate.Admit();
        first.RecordSuccess();

        gate.CurrentState.Should().Be("HalfOpen");
        second.RecordSuccess();
        gate.CurrentState.Should().Be("Closed");
    }

    [Fact]
    public void Neutral_probe_completion_releases_only_its_own_slot()
    {
        MutableUtcClock clock = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        CircuitBreakerGate gate = new("admission-generation", new CircuitBreakerOptions
        {
            FailureThreshold = 1,
            DurationOfBreakSeconds = 30
        }, clock.ToFunc());

        gate.Admit().RecordFailure();
        clock.Advance(TimeSpan.FromSeconds(31));
        CircuitBreakerGate.CallAdmission cancelled = gate.Admit();
        cancelled.RecordCallCancelled();
        CircuitBreakerGate.CallAdmission next = gate.Admit();
        cancelled.RecordFailure();

        gate.CurrentState.Should().Be("HalfOpen");
        next.RecordSuccess();
        gate.CurrentState.Should().Be("Closed");
    }
}
