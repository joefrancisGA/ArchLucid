using ArchLucid.Core.Pagination;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Pagination;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingCursorCodecTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(12)]
    [InlineData(123)]
    [InlineData(-77)]
    public void FindingCursorCodec_RoundTripsSortOrderAndFindingRecordId(int sortOrder)
    {
        Guid findingRecordId = Guid.NewGuid();

        string encoded = FindingCursorCodec.Encode(sortOrder, findingRecordId);

        encoded.Should().NotContain("=").And.NotContain("+").And.NotContain("/");
        FindingCursorCodec.TryDecode(encoded).Should().Be((sortOrder, findingRecordId));
    }

    [Fact]
    public void FindingCursorCodec_TryDecode_TrimsSurroundingWhitespace()
    {
        Guid findingRecordId = Guid.NewGuid();

        string encoded = FindingCursorCodec.Encode(11, findingRecordId);

        FindingCursorCodec.TryDecode($"\t{encoded}\n").Should().Be((11, findingRecordId));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void FindingCursorCodec_TryDecode_BlankCursor_ReturnsNull(string? encoded)
    {
        FindingCursorCodec.TryDecode(encoded).Should().BeNull();
    }

    [Fact]
    public void FindingCursorCodec_TryDecode_EmptyFindingRecordId_ReturnsNull()
    {
        FindingCursorCodec.TryDecode(FindingCursorCodec.Encode(3, Guid.Empty)).Should().BeNull();
    }

    [Fact]
    public void FindingCursorCodec_TryDecode_NullPayload_ReturnsNull()
    {
        FindingCursorCodec.TryDecode(JsonCursorTestHelper.EncodeJsonCursor("null")).Should().BeNull();
    }
}
