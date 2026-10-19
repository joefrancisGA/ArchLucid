using ArchLucid.ArtifactSynthesis.Docx;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DocxManifestFieldPresentationTests
{
    [Fact]
    public void FormatManifestTableCell_distinguishes_null_whitespace_and_values()
    {
        DocxManifestFieldPresentation.FormatManifestTableCell(null, "Requirement name")
            .Should()
            .Be("Requirement name was not stored.");
        DocxManifestFieldPresentation.FormatManifestTableCell(" ", "Coverage status")
            .Should()
            .Be("Coverage status was stored empty.");
        DocxManifestFieldPresentation.FormatManifestTableCell("Covered", "Coverage status")
            .Should()
            .Be("Covered");
    }

    [Fact]
    public void FormatComparedOptionalValue_distinguishes_null_and_empty()
    {
        DocxManifestFieldPresentation.FormatComparedOptionalValue(null)
            .Should()
            .Be("Compared value was not stored.");
        DocxManifestFieldPresentation.FormatComparedOptionalValue("")
            .Should()
            .Be("Compared value was stored empty.");
        DocxManifestFieldPresentation.FormatComparedOptionalValue("prod")
            .Should()
            .Be("prod");
    }
}
