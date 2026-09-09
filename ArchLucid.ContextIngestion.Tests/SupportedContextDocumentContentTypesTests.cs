using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Supported Context Document Content Types.
/// </summary>
[Trait("Suite", "Core")]
public sealed class SupportedContextDocumentContentTypesTests
{
    [Theory]
    [InlineData("text/plain", true)]
    [InlineData("TEXT/PLAIN", true)]
    [InlineData(" text/plain ", true)]
    [InlineData("text/markdown", true)]
    [InlineData("application/vnd.archlucid.diagram+json", true)]
    [InlineData("APPLICATION/VND.ARCHLUCID.DIAGRAM+JSON", true)]
    [InlineData("image/png", false)]
    [InlineData("application/pdf", false)]
    [InlineData("", false)]
    public void IsSupported_MatchesCanonicalList(string contentType, bool expected)
    {
        SupportedContextDocumentContentTypes.IsSupported(contentType).Should().Be(expected);
    }

    [Fact]
    public void All_AlignsWithPlainTextParserExpectations()
    {
        SupportedContextDocumentContentTypes.All.Should().Contain(
        [
            "text/plain",
            "text/markdown",
            SupportedContextDocumentContentTypes.StructuredDiagramJson,
        ]);
    }

    [Theory]
    [InlineData("image/png")]
    [InlineData("image/jpeg")]
    [InlineData("IMAGE/SVG+XML")]
    public void IsForbiddenImageContentType_RejectsImageMimeTypes(string contentType)
    {
        SupportedContextDocumentContentTypes.IsForbiddenImageContentType(contentType).Should().BeTrue();
        SupportedContextDocumentContentTypes.IsSupported(contentType).Should().BeFalse();
    }
}
