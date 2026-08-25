using ArchLucid.Application.Governance;
using ArchLucid.Decisioning.Advisory.Scheduling;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRecurrenceNextRunCalculatorTests
{
    private readonly ArchitectureReviewRecurrenceNextRunCalculator _sut =
        new(new SimpleScanScheduleCalculator());

    [Fact]
    public void ComputeNextRunUtc_WeeklyMondayAtEight_MatchesDecisioningCalculator()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("0 8 * * 1", from);

        next.Should().Be(new DateTime(2026, 3, 30, 8, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeNextRunsUtc_PreviewMatchesBackendSemantics()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);
        SimpleScanScheduleCalculator decisioning = new();

        IReadOnlyList<DateTime> applicationRuns = _sut.ComputeNextRunsUtc("0 8 * * 1", from, 5);
        IReadOnlyList<DateTime> decisioningRuns = decisioning.ComputeNextRunsUtc("0 8 * * 1", from, 5);

        applicationRuns.Should().Equal(decisioningRuns);
    }

    [Fact]
    public void IsSupportedCronExpression_RejectsInvalidCron()
    {
        _sut.IsSupportedCronExpression("not-a-real-cron").Should().BeFalse();
    }

    [Fact]
    public void ComputeNextRunUtc_returns_null_when_schedule_disabled()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("0 8 * * 1", from, isScheduleEnabled: false);

        next.Should().BeNull();
    }

    [Fact]
    public void ComputeNextRunUtc_normalizes_unspecified_reference_kind_to_utc()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Unspecified);

        DateTime? next = _sut.ComputeNextRunUtc("0 8 * * 1", from);

        next.Should().Be(new DateTime(2026, 3, 30, 8, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeNextRunUtc_returns_utc_kind_even_when_reference_is_local()
    {
        DateTime fromLocal = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Local);

        DateTime? next = _sut.ComputeNextRunUtc("@daily", fromLocal);

        next.Should().NotBeNull();
        next!.Value.Kind.Should().Be(DateTimeKind.Utc);
        next.Value.Should().Be(fromLocal.ToUniversalTime().AddDays(1));
    }

    [Fact]
    public void ComputeNextRunsUtc_normalizes_unspecified_reference_kind()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Unspecified);

        IReadOnlyList<DateTime> runs = _sut.ComputeNextRunsUtc("0 8 * * 1", from, 2);

        runs.Should().HaveCount(2);
        runs[0].Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public void ComputeNextRunUtc_recomputes_when_first_occurrence_is_not_strictly_after_reference()
    {
        DateTime reference = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);
        StubScanScheduleCalculator stub = new(reference, reference.AddHours(1));
        ArchitectureReviewRecurrenceNextRunCalculator sut = new(stub);

        DateTime? next = sut.ComputeNextRunUtc("@hourly", reference);

        next.Should().Be(reference.AddHours(1));
        stub.CallCount.Should().Be(2);
    }

    [Fact]
    public void ComputeNextRunsUtc_advances_first_preview_when_underlying_returns_reference_instant()
    {
        DateTime reference = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);
        NonAdvancingScanScheduleCalculator stub = new(reference, reference.AddHours(1));
        ArchitectureReviewRecurrenceNextRunCalculator sut = new(stub);

        IReadOnlyList<DateTime> previewRuns = sut.ComputeNextRunsUtc("@hourly", reference, 1);

        previewRuns.Should().ContainSingle();
        previewRuns[0].Should().Be(reference.AddHours(1));
    }

    [Fact]
    public void ComputeNextRunsUtc_from_exact_weekly_occurrence_returns_following_mondays()
    {
        DateTime from = new(2026, 3, 30, 8, 0, 0, DateTimeKind.Utc);

        IReadOnlyList<DateTime> runs = _sut.ComputeNextRunsUtc("0 8 * * 1", from, 2);

        runs.Should().Equal(
            new DateTime(2026, 4, 6, 8, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 4, 13, 8, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeNextRunsUtc_returns_empty_when_count_is_zero()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        IReadOnlyList<DateTime> runs = _sut.ComputeNextRunsUtc("0 8 * * 1", from, 0);

        runs.Should().BeEmpty();
    }

    [Fact]
    public void ComputeNextRunsUtc_stamps_utc_kind_when_underlying_returns_unspecified_kind()
    {
        DateTime reference = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);
        UnspecifiedKindScanScheduleCalculator stub = new(reference.AddHours(1));
        ArchitectureReviewRecurrenceNextRunCalculator sut = new(stub);

        IReadOnlyList<DateTime> previewRuns = sut.ComputeNextRunsUtc("@hourly", reference, 1);

        previewRuns.Should().ContainSingle();
        previewRuns[0].Kind.Should().Be(DateTimeKind.Utc);
    }

    private sealed class StubScanScheduleCalculator : IScanScheduleCalculator
    {
        private readonly DateTime _first;
        private readonly DateTime _second;
        private int _calls = 0;

        public StubScanScheduleCalculator(DateTime first, DateTime second)
        {
            _first = first;
            _second = second;
        }

        public int CallCount => _calls;

        public bool IsSupportedCronExpression(string cronExpression) => true;

        public DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc)
        {
            _calls++;

            return _calls == 1 ? _first : _second;
        }

        public IReadOnlyList<DateTime> ComputeNextRunsUtc(string cronExpression, DateTime fromUtc, int count) =>
            ScanScheduleNextRuns.Compute(this, cronExpression, fromUtc, count);
    }

    private sealed class NonAdvancingScanScheduleCalculator : IScanScheduleCalculator
    {
        private readonly DateTime _first;
        private readonly DateTime _second;
        private int _calls = 0;

        public NonAdvancingScanScheduleCalculator(DateTime first, DateTime second)
        {
            _first = first;
            _second = second;
        }

        public bool IsSupportedCronExpression(string cronExpression) => true;

        public DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc)
        {
            _calls++;

            return _calls == 1 ? _first : _second;
        }

        public IReadOnlyList<DateTime> ComputeNextRunsUtc(string cronExpression, DateTime fromUtc, int count) =>
            ScanScheduleNextRuns.Compute(this, cronExpression, fromUtc, count);
    }

    private sealed class UnspecifiedKindScanScheduleCalculator : IScanScheduleCalculator
    {
        private readonly DateTime _next;

        public UnspecifiedKindScanScheduleCalculator(DateTime next)
        {
            _next = next;
        }

        public bool IsSupportedCronExpression(string cronExpression) => true;

        public DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc) =>
            DateTime.SpecifyKind(_next, DateTimeKind.Unspecified);

        public IReadOnlyList<DateTime> ComputeNextRunsUtc(string cronExpression, DateTime fromUtc, int count) =>
            ScanScheduleNextRuns.Compute(this, cronExpression, fromUtc, count);
    }
}
