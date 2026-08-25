using ArchLucid.Core.Pagination;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Pagination;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactCursorCodecTests
{
    // Varying the integer width shifts the payload length through every Base64 padding residue.
    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(12)]
    [InlineData(123)]
    [InlineData(-4096)]
    public void ArtifactCursorCodec_RoundTripsSortOrderAndArtifactId(int sortOrder)
    {
        Guid artifactId = Guid.NewGuid();

        string encoded = ArtifactCursorCodec.Encode(sortOrder, artifactId);

        encoded.Should().NotContain("=").And.NotContain("+").And.NotContain("/");
        ArtifactCursorCodec.TryDecode(encoded).Should().Be((sortOrder, artifactId));
    }

    [Fact]
    public void ArtifactCursorCodec_TryDecode_TrimsSurroundingWhitespace()
    {
        Guid artifactId = Guid.NewGuid();

        string encoded = ArtifactCursorCodec.Encode(7, artifactId);

        ArtifactCursorCodec.TryDecode($"  {encoded}  ").Should().Be((7, artifactId));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ArtifactCursorCodec_TryDecode_BlankCursor_ReturnsNull(string? encoded)
    {
        ArtifactCursorCodec.TryDecode(encoded).Should().BeNull();
    }

    [Fact]
    public void ArtifactCursorCodec_TryDecode_EmptyArtifactId_ReturnsNull()
    {
        ArtifactCursorCodec.TryDecode(ArtifactCursorCodec.Encode(3, Guid.Empty)).Should().BeNull();
    }

    [Fact]
    public void ArtifactCursorCodec_TryDecode_NullPayload_ReturnsNull()
    {
        ArtifactCursorCodec.TryDecode(JsonCursorTestHelper.EncodeJsonCursor("null")).Should().BeNull();
    }
}
