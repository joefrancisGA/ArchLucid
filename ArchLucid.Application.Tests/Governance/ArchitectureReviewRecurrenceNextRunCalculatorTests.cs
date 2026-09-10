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

    [Fact]
    public void ComputeNextRunUtc_from_exact_weekly_occurrence_returns_next_monday()
    {
        DateTime from = new(2026, 3, 30, 8, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("0 8 * * 1", from);

        next.Should().Be(new DateTime(2026, 4, 6, 8, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeNextRunsUtc_returns_empty_when_count_is_negative()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        IReadOnlyList<DateTime> runs = _sut.ComputeNextRunsUtc("0 8 * * 1", from, -3);

        runs.Should().BeEmpty();
    }

    [Fact]
    public void IsSupportedCronExpression_rejects_whitespace_only_cron()
    {
        _sut.IsSupportedCronExpression("   ").Should().BeFalse();
    }

    [Fact]
    public void ComputeNextRunUtc_returns_null_for_whitespace_only_cron()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("   ", from);

        next.Should().BeNull();
    }

    [Fact]
    public void ComputeNextRunUtc_returns_null_when_underlying_retry_still_not_after_reference()
    {
        DateTime reference = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);
        PastThenExactScanScheduleCalculator stub = new(reference.AddHours(-1), reference);
        ArchitectureReviewRecurrenceNextRunCalculator sut = new(stub);

        DateTime? next = sut.ComputeNextRunUtc("@hourly", reference);

        next.Should().BeNull();
        stub.CallCount.Should().Be(2);
    }

    [Fact]
    public void ComputeNextRunUtc_returns_null_for_null_cron_expression()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc(null!, from);

        next.Should().BeNull();
    }

    [Fact]
    public void ComputeNextRunUtc_returns_null_for_invalid_cron_expression()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("not-a-real-cron", from);

        next.Should().BeNull();
    }

    [Fact]
    public void ComputeNextRunUtc_accepts_padded_cron_expression()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("  0 8 * * 1  ", from);

        next.Should().Be(new DateTime(2026, 3, 30, 8, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeNextRunsUtc_returns_empty_for_invalid_cron_expression()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        IReadOnlyList<DateTime> runs = _sut.ComputeNextRunsUtc("not-a-real-cron", from, 3);

        runs.Should().BeEmpty();
    }

    [Fact]
    public void ComputeNextRunUtc_stamps_utc_kind_when_underlying_returns_unspecified_kind()
    {
        DateTime reference = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);
        UnspecifiedKindScanScheduleCalculator stub = new(reference.AddHours(1));
        ArchitectureReviewRecurrenceNextRunCalculator sut = new(stub);

        DateTime? next = sut.ComputeNextRunUtc("@hourly", reference);

        next.Should().NotBeNull();
        next!.Value.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public void ComputeNextRunsUtc_stops_when_underlying_returns_null_after_first_occurrence()
    {
        DateTime reference = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);
        ThenNullScanScheduleCalculator stub = new(reference.AddHours(1));
        ArchitectureReviewRecurrenceNextRunCalculator sut = new(stub);

        IReadOnlyList<DateTime> runs = sut.ComputeNextRunsUtc("@hourly", reference, 3);

        runs.Should().ContainSingle();
        runs[0].Should().Be(reference.AddHours(1));
    }

    [Fact]
    public void Constructor_throws_when_schedule_calculator_is_null()
    {
        Action act = () => new ArchitectureReviewRecurrenceNextRunCalculator(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("scheduleCalculator");
    }

    [Fact]
    public void IsSupportedCronExpression_rejects_empty_cron()
    {
        _sut.IsSupportedCronExpression(string.Empty).Should().BeFalse();
    }

    [Fact]
    public void ComputeNextRunUtc_returns_null_for_empty_cron_expression()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc(string.Empty, from);

        next.Should().BeNull();
    }

    [Fact]
    public void ComputeNextRunsUtc_returns_empty_for_empty_cron_expression()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        IReadOnlyList<DateTime> runs = _sut.ComputeNextRunsUtc(string.Empty, from, 3);

        runs.Should().BeEmpty();
    }

    [Fact]
    public void ComputeNextRunsUtc_returns_empty_for_whitespace_only_cron()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        IReadOnlyList<DateTime> runs = _sut.ComputeNextRunsUtc("   ", from, 3);

        runs.Should().BeEmpty();
    }

    [Fact]
    public void ComputeNextRunsUtc_normalizes_local_reference_kind()
    {
        DateTime fromLocal = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Local);

        IReadOnlyList<DateTime> runs = _sut.ComputeNextRunsUtc("@daily", fromLocal, 1);

        runs.Should().ContainSingle();
        runs[0].Kind.Should().Be(DateTimeKind.Utc);
        runs[0].Should().Be(fromLocal.ToUniversalTime().AddDays(1));
    }

    [Fact]
    public void ComputeNextRunsUtc_does_not_emit_duplicate_instants_when_underlying_repeats_same_occurrence()
    {
        DateTime reference = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);
        RepeatingScanScheduleCalculator stub = new(reference.AddHours(1));
        ArchitectureReviewRecurrenceNextRunCalculator sut = new(stub);

        IReadOnlyList<DateTime> runs = sut.ComputeNextRunsUtc("@hourly", reference, 3);

        runs.Should().ContainSingle();
        runs[0].Should().Be(reference.AddHours(1));
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

    private sealed class PastThenExactScanScheduleCalculator : IScanScheduleCalculator
    {
        private readonly DateTime _first;
        private readonly DateTime _second;
        private int _calls = 0;

        public PastThenExactScanScheduleCalculator(DateTime first, DateTime second)
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

    private sealed class ThenNullScanScheduleCalculator : IScanScheduleCalculator
    {
        private readonly DateTime _first;
        private int _calls = 0;

        public ThenNullScanScheduleCalculator(DateTime first)
        {
            _first = first;
        }

        public bool IsSupportedCronExpression(string cronExpression) => true;

        public DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc)
        {
            _calls++;

            return _calls == 1 ? _first : null;
        }

        public IReadOnlyList<DateTime> ComputeNextRunsUtc(string cronExpression, DateTime fromUtc, int count) =>
            ScanScheduleNextRuns.Compute(this, cronExpression, fromUtc, count);
    }

    private sealed class RepeatingScanScheduleCalculator : IScanScheduleCalculator
    {
        private readonly DateTime _instant;

        public RepeatingScanScheduleCalculator(DateTime instant)
        {
            _instant = instant;
        }

        public bool IsSupportedCronExpression(string cronExpression) => true;

        public DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc) => _instant;

        public IReadOnlyList<DateTime> ComputeNextRunsUtc(string cronExpression, DateTime fromUtc, int count) =>
            ScanScheduleNextRuns.Compute(this, cronExpression, fromUtc, count);
    }
}
