using ArchLucid.Application.Evidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Category", "Unit")]
public sealed class StoredEvidenceFileContentSafetyTests
{
    [Theory]
    [InlineData("text/html", "notes.txt", true)]
    [InlineData("text/html; charset=utf-8", "notes.txt", true)]
    [InlineData("application/xhtml+xml; charset=UTF-8", "notes.txt", true)]
    [InlineData("image/svg+xml; charset=utf-8", "notes.txt", true)]
    [InlineData("image/svg+xml", "diagram.svg", true)]
    [InlineData("image/png", "diagram.png", false)]
    [InlineData("application/pdf", "brief.pdf", false)]
    public void MustForceAttachmentDisposition_blocks_unsafe_types(
        string contentType,
        string fileName,
        bool expected)
    {
        StoredEvidenceFileContentSafety.MustForceAttachmentDisposition(contentType, fileName)
            .Should()
            .Be(expected);
    }

    [Theory]
    [InlineData("image/png", "diagram.png", true)]
    [InlineData("image/png; charset=binary", "diagram.png", true)]
    [InlineData("text/plain", "notes.txt", true)]
    [InlineData("text/plain; charset=utf-8", "notes.txt", true)]
    [InlineData("application/pdf", "brief.pdf", true)]
    [InlineData("image/svg+xml", "diagram.svg", false)]
    public void IsPreviewableContentType_matches_allowlist(
        string contentType,
        string fileName,
        bool expected)
    {
        StoredEvidenceFileContentSafety.IsPreviewableContentType(contentType, fileName)
            .Should()
            .Be(expected);
    }
}
