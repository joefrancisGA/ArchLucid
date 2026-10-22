using ArchLucid.Core;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Services;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Services;

/// <summary>
///     Branch coverage for <see cref="ReplayDiagnosticsRecorder" /> retention and max-count trimming.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ReplayDiagnosticsRecorderTests
{
    [Fact]
    public void GetRecent_when_more_than_maxCount_returns_tail_slice()
    {
        Mock<IOptionsMonitor<ReplayDiagnosticsOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new ReplayDiagnosticsOptions { MaxRetainedRecords = 100, RetentionMinutes = 0 });
        ReplayDiagnosticsRecorder sut = new(options.Object);

        for (int i = 0; i < 5; i++)
            sut.Record(NewEntry($"entry-{i}"));

        IReadOnlyList<ReplayDiagnosticsEntry> recent = sut.GetRecent(2);

        recent.Should().HaveCount(2);
        recent[0].ComparisonRecordId.Should().Be("entry-3");
        recent[1].ComparisonRecordId.Should().Be("entry-4");
    }

    [Fact]
    public void Record_invalid_max_retained_defaults_to_one_hundred()
    {
        Mock<IOptionsMonitor<ReplayDiagnosticsOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new ReplayDiagnosticsOptions { MaxRetainedRecords = 0, RetentionMinutes = 0 });
        ReplayDiagnosticsRecorder sut = new(options.Object);

        for (int i = 0; i < 101; i++)
            sut.Record(NewEntry($"x-{i}"));

        sut.GetRecent(200).Should().HaveCount(100);
    }

    [Fact]
    public void GetRecent_with_zero_retention_returns_all_within_capacity()
    {
        Mock<IOptionsMonitor<ReplayDiagnosticsOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new ReplayDiagnosticsOptions { MaxRetainedRecords = 10, RetentionMinutes = 0 });
        ReplayDiagnosticsRecorder sut = new(options.Object);

        sut.Record(new ReplayDiagnosticsEntry
        {
            TimestampUtc = TimeProvider.System.UtcNowDateTime().AddDays(-1),
            ComparisonRecordId = "old-but-kept"
        });

        sut.GetRecent(10).Should().Contain(e => e.ComparisonRecordId == "old-but-kept");
    }

    private static ReplayDiagnosticsEntry NewEntry(string id)
    {
        return new ReplayDiagnosticsEntry { TimestampUtc = TimeProvider.System.UtcNowDateTime(), ComparisonRecordId = id };
    }
}
