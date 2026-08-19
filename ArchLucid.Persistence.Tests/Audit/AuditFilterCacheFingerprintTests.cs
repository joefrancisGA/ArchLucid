using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Audit;

namespace ArchLucid.Persistence.Tests.Audit;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuditFilterCacheFingerprintTests
{
    [Fact]
    public void Build_throws_for_null_filter()
    {
        Action act = () => AuditFilterCacheFingerprint.Build(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Build_uses_empty_segments_for_unset_fields()
    {
        string fingerprint = AuditFilterCacheFingerprint.Build(new AuditEventFilter());

        // Six joined segments (EventType, FromUtc, ToUtc, CorrelationId, ActorUserId, RunId) yield five '|' separators.
        fingerprint.Should().Be("|||||");
    }

    [Fact]
    public void Build_includes_event_type_and_actor_when_set()
    {
        AuditEventFilter filter = new()
        {
            EventType = "com.archlucid.alert.fired",
            CorrelationId = "corr-1",
            ActorUserId = "user-1",
        };

        string fingerprint = AuditFilterCacheFingerprint.Build(filter);

        fingerprint.Should().Be("com.archlucid.alert.fired|||corr-1|user-1|");
    }

    [Fact]
    public void Build_formats_from_and_to_instants_as_round_trip_utc()
    {
        DateTime fromUtc = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        DateTime toUtc = new(2026, 1, 2, 6, 30, 0, DateTimeKind.Utc);

        AuditEventFilter filter = new() { FromUtc = fromUtc, ToUtc = toUtc };

        string fingerprint = AuditFilterCacheFingerprint.Build(filter);

        fingerprint.Should().Be($"|{fromUtc:O}|{toUtc:O}|||");
    }

    [Fact]
    public void Build_includes_run_id_in_hyphenated_format_as_last_segment()
    {
        Guid runId = Guid.Parse("11111111-2222-3333-4444-555555555555");

        AuditEventFilter filter = new() { RunId = runId };

        string fingerprint = AuditFilterCacheFingerprint.Build(filter);

        fingerprint.Should().Be($"|||||{runId:D}");
    }

    [Fact]
    public void Build_is_stable_for_equivalent_filters()
    {
        AuditEventFilter first = new() { EventType = "x", ActorUserId = "u" };
        AuditEventFilter second = new() { EventType = "x", ActorUserId = "u" };

        AuditFilterCacheFingerprint.Build(first).Should().Be(AuditFilterCacheFingerprint.Build(second));
    }
}
