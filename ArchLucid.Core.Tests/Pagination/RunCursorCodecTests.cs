using ArchLucid.Core.Pagination;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Pagination;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunCursorCodecTests
{
    [Fact]
    public void RunCursorCodec_RoundTripsCreatedUtcAndRunId()
    {
        DateTime createdUtc = new(2026, 8, 8, 17, 4, 33, 512, DateTimeKind.Utc);
        Guid runId = Guid.NewGuid();

        (DateTime CreatedUtc, Guid RunId)? decoded = RunCursorCodec.TryDecode(
            RunCursorCodec.Encode(createdUtc, runId));

        decoded.Should().NotBeNull();
        decoded!.Value.CreatedUtc.Should().Be(createdUtc);
        decoded.Value.CreatedUtc.Kind.Should().Be(DateTimeKind.Utc);
        decoded.Value.RunId.Should().Be(runId);
    }

    [Fact]
    public void RunCursorCodec_Encode_TreatsUnspecifiedKindAsUtc()
    {
        DateTime unspecified = new(2026, 1, 2, 3, 4, 5, DateTimeKind.Unspecified);
        Guid runId = Guid.NewGuid();

        (DateTime CreatedUtc, Guid RunId)? decoded = RunCursorCodec.TryDecode(
            RunCursorCodec.Encode(unspecified, runId));

        decoded.Should().NotBeNull();
        decoded!.Value.CreatedUtc.Should().Be(DateTime.SpecifyKind(unspecified, DateTimeKind.Utc));
        decoded.Value.CreatedUtc.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public void RunCursorCodec_TryDecode_OffsetTimestamp_IsNormalizedToUtc()
    {
        Guid runId = Guid.NewGuid();
        string cursor = JsonCursorTestHelper.EncodeJsonCursor(
            $"{{\"cu\":\"2026-08-08T12:00:00.0000000+02:00\",\"ri\":\"{runId}\"}}");

        (DateTime CreatedUtc, Guid RunId)? decoded = RunCursorCodec.TryDecode(cursor);

        decoded.Should().NotBeNull();
        decoded!.Value.CreatedUtc.Kind.Should().Be(DateTimeKind.Utc);
        decoded.Value.CreatedUtc.Should().Be(new DateTime(2026, 8, 8, 10, 0, 0, DateTimeKind.Utc));
        decoded.Value.RunId.Should().Be(runId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void RunCursorCodec_TryDecode_BlankCursor_ReturnsNull(string? encoded)
    {
        RunCursorCodec.TryDecode(encoded).Should().BeNull();
    }

    [Fact]
    public void RunCursorCodec_TryDecode_MalformedBase64_ReturnsNull()
    {
        RunCursorCodec.TryDecode("not-a-valid-cursor!!").Should().BeNull();
    }

    [Fact]
    public void RunCursorCodec_TryDecode_NullPayload_ReturnsNull()
    {
        RunCursorCodec.TryDecode(JsonCursorTestHelper.EncodeJsonCursor("null")).Should().BeNull();
    }

    [Fact]
    public void RunCursorCodec_TryDecode_MissingTimestamp_ReturnsNull()
    {
        RunCursorCodec.TryDecode(JsonCursorTestHelper.EncodeJsonCursor($"{{\"cu\":\"\",\"ri\":\"{Guid.NewGuid()}\"}}"))
            .Should().BeNull();
    }

    [Fact]
    public void RunCursorCodec_TryDecode_EmptyRunId_ReturnsNull()
    {
        RunCursorCodec.TryDecode(RunCursorCodec.Encode(DateTime.UtcNow, Guid.Empty)).Should().BeNull();
    }

    [Fact]
    public void RunCursorCodec_TryDecode_UnparseableTimestamp_ReturnsNull()
    {
        RunCursorCodec.TryDecode(
                JsonCursorTestHelper.EncodeJsonCursor($"{{\"cu\":\"never\",\"ri\":\"{Guid.NewGuid()}\"}}"))
            .Should().BeNull();
    }
}
