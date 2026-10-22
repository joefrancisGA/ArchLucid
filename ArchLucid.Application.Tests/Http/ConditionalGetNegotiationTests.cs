using ArchLucid.Application.Http;
using ArchLucid.Core.Audit;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Http;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConditionalGetNegotiationTests
{
    [Fact]
    public void TryFromRowVersion_returns_quoted_hex_for_non_empty_stamp()
    {
        byte[] stamp = [0x01, 0xAB, 0xFF];

        bool found = ConditionalGetNegotiation.TryFromRowVersion(stamp, out string etag);

        found.Should().BeTrue();
        etag.Should().Be("\"01abff\"");
    }

    [Fact]
    public void TryMatchIfNoneMatch_matches_strong_and_weak_prefix_tokens()
    {
        const string etag = "\"abc\"";

        ConditionalGetNegotiation.TryMatchIfNoneMatch(["W/\"abc\""], etag).Should().BeTrue();
        ConditionalGetNegotiation.TryMatchIfNoneMatch(["\"abc\", \"other\""], etag).Should().BeTrue();
        ConditionalGetNegotiation.TryMatchIfNoneMatch(["\"stale\""], etag).Should().BeFalse();
    }

    [Fact]
    public void ComputeRunListEtag_changes_when_any_row_version_changes()
    {
        Guid runA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        RunSummaryRowVersionSlice[] baseline =
        [
            new(runA, [1, 2, 3]),
            new(runB, [4, 5, 6])
        ];

        string first = ConditionalGetNegotiation.ComputeRunListEtag(baseline, "take=25");
        string second = ConditionalGetNegotiation.ComputeRunListEtag(
            [new(runA, [1, 2, 4]), new(runB, [4, 5, 6])],
            "take=25");

        first.Should().NotBe(second);
    }

    [Fact]
    public void ComputeAuditPageEtag_changes_when_newest_event_changes()
    {
        AuditEvent older = new()
        {
            EventId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            OccurredUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        AuditEvent newer = new()
        {
            EventId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            OccurredUtc = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc)
        };

        string baseline = ConditionalGetNegotiation.ComputeAuditPageEtag([newer, older], "take=50");
        AuditEvent replacedHead = new()
        {
            EventId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            OccurredUtc = newer.OccurredUtc
        };
        string changed = ConditionalGetNegotiation.ComputeAuditPageEtag([replacedHead, older], "take=50");

        baseline.Should().NotBe(changed);
    }
}
