using ArchLucid.Core.Audit;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Audit;

[Trait("Suite", "Core")]
public sealed class AuditEventFilterTests
{
    [Fact]
    public void Default_Take_is_100()
    {
        AuditEventFilter filter = new();

        filter.Take.Should().Be(100);
    }

    [Fact]
    public void Properties_round_trip_filter_shape()
    {
        Guid runId = Guid.NewGuid();
        Guid beforeEventId = Guid.NewGuid();
        DateTime fromUtc = new(2026, 5, 1, 12, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = fromUtc.AddHours(2);
        DateTime beforeUtc = fromUtc.AddMinutes(30);

        AuditEventFilter filter = new()
        {
            EventType = "RunStarted",
            FromUtc = fromUtc,
            ToUtc = toUtc,
            BeforeUtc = beforeUtc,
            BeforeEventId = beforeEventId,
            CorrelationId = "corr-1",
            ActorUserId = "user-42",
            RunId = runId,
            Take = 25,
        };

        filter.EventType.Should().Be("RunStarted");
        filter.FromUtc.Should().Be(fromUtc);
        filter.ToUtc.Should().Be(toUtc);
        filter.BeforeUtc.Should().Be(beforeUtc);
        filter.BeforeEventId.Should().Be(beforeEventId);
        filter.CorrelationId.Should().Be("corr-1");
        filter.ActorUserId.Should().Be("user-42");
        filter.RunId.Should().Be(runId);
        filter.Take.Should().Be(25);
    }
}
