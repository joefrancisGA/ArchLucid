using ArchLucid.Core.Pagination;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Pagination;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuditEventCursorCodecTests
{
    [Fact]
    public void AuditEventCursorCodec_RoundTripsOccurredUtcAndEventId()
    {
        DateTime occurredUtc = new(2026, 3, 14, 15, 9, 26, 535, DateTimeKind.Utc);
        Guid eventId = Guid.NewGuid();

        (DateTime OccurredUtc, Guid EventId)? decoded = AuditEventCursorCodec.TryDecode(
            AuditEventCursorCodec.Encode(occurredUtc, eventId));

        decoded.Should().NotBeNull();
        decoded!.Value.OccurredUtc.Should().Be(occurredUtc);
        decoded.Value.OccurredUtc.Kind.Should().Be(DateTimeKind.Utc);
        decoded.Value.EventId.Should().Be(eventId);
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_OffsetTimestamp_IsNormalizedToUtc()
    {
        Guid eventId = Guid.NewGuid();
        string cursor = JsonCursorTestHelper.EncodeJsonCursor(
            $"{{\"ou\":\"2026-08-08T23:30:00.0000000-04:00\",\"ei\":\"{eventId}\"}}");

        (DateTime OccurredUtc, Guid EventId)? decoded = AuditEventCursorCodec.TryDecode(cursor);

        decoded.Should().NotBeNull();
        decoded!.Value.OccurredUtc.Kind.Should().Be(DateTimeKind.Utc);
        decoded.Value.OccurredUtc.Should().Be(new DateTime(2026, 8, 9, 3, 30, 0, DateTimeKind.Utc));
        decoded.Value.EventId.Should().Be(eventId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void AuditEventCursorCodec_TryDecode_BlankCursor_ReturnsNull(string? encoded)
    {
        AuditEventCursorCodec.TryDecode(encoded).Should().BeNull();
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_MalformedBase64_ReturnsNull()
    {
        AuditEventCursorCodec.TryDecode("$$$not-base64$$$").Should().BeNull();
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_NullPayload_ReturnsNull()
    {
        AuditEventCursorCodec.TryDecode(JsonCursorTestHelper.EncodeJsonCursor("null")).Should().BeNull();
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_MissingTimestamp_ReturnsNull()
    {
        AuditEventCursorCodec.TryDecode(JsonCursorTestHelper.EncodeJsonCursor($"{{\"ou\":\"\",\"ei\":\"{Guid.NewGuid()}\"}}"))
            .Should().BeNull();
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_EmptyEventId_ReturnsNull()
    {
        AuditEventCursorCodec.TryDecode(AuditEventCursorCodec.Encode(DateTime.UtcNow, Guid.Empty))
            .Should().BeNull();
    }

    [Fact]
    public void AuditEventCursorCodec_TryDecode_UnparseableTimestamp_ReturnsNull()
    {
        AuditEventCursorCodec.TryDecode(
                JsonCursorTestHelper.EncodeJsonCursor($"{{\"ou\":\"whenever\",\"ei\":\"{Guid.NewGuid()}\"}}"))
            .Should().BeNull();
    }
}
