using ArchLucid.Core.Configuration;
using ArchLucid.Core.Evidence;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Evidence;

public sealed class EvidenceBulkUploadAnomalyTrackerTests
{
    [Fact]
    public void RecordAndEvaluate_when_disabled_does_not_throttle()
    {
        EvidenceBulkUploadAnomalyOptions opts = new() { Enabled = false };
        EvidenceBulkUploadAnomalyTracker tracker = CreateTracker(opts);

        bool detected = tracker.RecordAndEvaluate("t:abc", 30);

        detected.Should().BeFalse();
        tracker.IsThrottled("t:abc").Should().BeFalse();
        tracker.GetPermitLimitMultiplier("t:abc").Should().Be(1.0);
    }

    [Fact]
    public void RecordAndEvaluate_when_spike_detected_throttles_and_returns_stricter_multiplier()
    {
        MutableTimeProvider clock = new(new DateTime(2026, 5, 18, 12, 0, 0, DateTimeKind.Utc));
        EvidenceBulkUploadAnomalyOptions opts = new()
        {
            Enabled = true,
            BaselineWindowMinutes = 120,
            ObservationWindowMinutes = 5,
            MinBaselineMinuteBuckets = 10,
            MinRequestsInObservationWindow = 3,
            ZScoreThreshold = 2.0,
            FallbackSpikeMultiplier = 3.0,
            ThrottleDurationMinutes = 15,
            StricterPermitLimitMultiplier = 0.25
        };

        EvidenceBulkUploadAnomalyTracker tracker = CreateTracker(opts, clock);
        string key = "t:" + Guid.NewGuid().ToString("N");

        for (int minute = 0; minute < 20; minute++)
        {
            tracker.RecordAndEvaluate(key, 1);
            clock.Advance(TimeSpan.FromMinutes(1));
        }

        bool detected = false;

        for (int burst = 0; burst < 20; burst++)
        {
            if (tracker.RecordAndEvaluate(key, 5))
                detected = true;
        }

        detected.Should().BeTrue();
        tracker.IsThrottled(key).Should().BeTrue();
        tracker.GetPermitLimitMultiplier(key).Should().Be(0.25);
    }

    [Fact]
    public void IsThrottled_clears_after_throttle_duration()
    {
        MutableTimeProvider clock = new(new DateTime(2026, 5, 18, 12, 0, 0, DateTimeKind.Utc));
        EvidenceBulkUploadAnomalyOptions opts = new()
        {
            Enabled = true,
            BaselineWindowMinutes = 120,
            ObservationWindowMinutes = 5,
            MinBaselineMinuteBuckets = 5,
            MinRequestsInObservationWindow = 2,
            ZScoreThreshold = 1.5,
            ThrottleDurationMinutes = 10,
            StricterPermitLimitMultiplier = 0.5
        };

        EvidenceBulkUploadAnomalyTracker tracker = CreateTracker(opts, clock);
        string key = "t:" + Guid.NewGuid().ToString("N");

        for (int minute = 0; minute < 10; minute++)
        {
            tracker.RecordAndEvaluate(key, 1);
            clock.Advance(TimeSpan.FromMinutes(1));
        }

        for (int burst = 0; burst < 15; burst++)
            tracker.RecordAndEvaluate(key, 1);

        tracker.IsThrottled(key).Should().BeTrue();

        clock.Advance(TimeSpan.FromMinutes(11));
        tracker.IsThrottled(key).Should().BeFalse();
    }

    private static EvidenceBulkUploadAnomalyTracker CreateTracker(
        EvidenceBulkUploadAnomalyOptions opts,
        TimeProvider? clock = null)
    {
        return new EvidenceBulkUploadAnomalyTracker(
            new StubOptionsMonitor<EvidenceBulkUploadAnomalyOptions>(opts),
            clock ?? TimeProvider.System);
    }

    private sealed class MutableTimeProvider(DateTimeOffset startUtc) : TimeProvider
    {
        private DateTimeOffset _utcNow = startUtc;

        public void Advance(TimeSpan delta)
        {
            _utcNow = _utcNow.Add(delta);
        }

        public override DateTimeOffset GetUtcNow()
        {
            return _utcNow;
        }
    }

    private sealed class StubOptionsMonitor<T>(T value) : IOptionsMonitor<T>
        where T : class
    {
        public T CurrentValue { get; } = value;

        public T Get(string? name)
        {
            return CurrentValue;
        }

        public IDisposable OnChange(Action<T, string?> listener)
        {
            return NullDisposable.Instance;
        }

        private sealed class NullDisposable : IDisposable
        {
            internal static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
