using ArchLucid.ArtifactSynthesis.Docx;

using FluentAssertions;

using Xunit;

namespace ArchLucid.ArtifactSynthesis.Tests.Docx;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DocxManifestFieldPresentationTests
{
    [Fact]
    public void FormatNullable_null_control_id_uses_not_stored_sentence()
    {
        DocxManifestFieldPresentation.FormatManifestTableCell(null, "Control id")
            .Should()
            .Be("Control id was not stored.");
    }

    [Fact]
    public void FormatNullable_empty_control_id_uses_stored_empty_sentence()
    {
        DocxManifestFieldPresentation.FormatManifestTableCell(string.Empty, "Control id")
            .Should()
            .Be("Control id was stored empty.");
    }
}
