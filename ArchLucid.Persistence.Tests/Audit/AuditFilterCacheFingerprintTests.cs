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
    public void Build_treats_missing_and_empty_text_filters_equivalently()
    {
        AuditEventFilter emptyText = new()
        {
            EventType = string.Empty,
            CorrelationId = string.Empty,
            ActorUserId = string.Empty,
        };

        AuditFilterCacheFingerprint.Build(emptyText).Should()
            .Be(AuditFilterCacheFingerprint.Build(new AuditEventFilter()));
    }

    [Fact]
    public void Build_distinguishes_each_filter_field()
    {
        AuditEventFilter[] filters =
        [
            new(),
            new() { EventType = "value" },
            new() { CorrelationId = "value" },
            new() { ActorUserId = "value" },
            new() { FromUtc = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc) },
            new() { ToUtc = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc) },
            new() { RunId = Guid.Parse("11111111-2222-3333-4444-555555555555") },
        ];

        filters.Select(AuditFilterCacheFingerprint.Build).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void Build_preserves_field_boundaries_when_text_contains_separators()
    {
        AuditEventFilter first = new() { CorrelationId = "a|b", ActorUserId = "c" };
        AuditEventFilter second = new() { CorrelationId = "a", ActorUserId = "b|c" };

        AuditFilterCacheFingerprint.Build(first).Should().NotBe(AuditFilterCacheFingerprint.Build(second));
    }

    [Fact]
    public void Build_does_not_collapse_local_and_utc_bounds_to_the_same_instant()
    {
        DateTime local = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Local);
        AuditEventFilter first = new() { FromUtc = local };
        AuditEventFilter second = new() { FromUtc = local.ToUniversalTime() };

        AuditFilterCacheFingerprint.Build(first).Should().NotBe(AuditFilterCacheFingerprint.Build(second));
    }

    [Fact]
    public void Build_is_stable_for_equivalent_filters()
    {
        AuditEventFilter first = new() { EventType = "x", ActorUserId = "u" };
        AuditEventFilter second = new() { EventType = "x", ActorUserId = "u" };

        AuditFilterCacheFingerprint.Build(first).Should().Be(AuditFilterCacheFingerprint.Build(second));
    }
}
