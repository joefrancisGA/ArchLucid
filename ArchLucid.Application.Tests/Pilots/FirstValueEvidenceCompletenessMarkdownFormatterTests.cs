using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FirstValueEvidenceCompletenessMarkdownFormatterTests
{
    [Fact]
    public void AppendMarkdownSection_Incomplete_IncludesWatermarkCallout()
    {
        StringBuilder sb = new();

        FirstValueEvidenceCompletenessMarkdownFormatter.AppendMarkdownSection(
            sb,
            FirstValueEvidenceCompletenessLevel.Incomplete);

        string md = sb.ToString();
        md.Should().Contain("First-value evidence completeness");
        md.Should().Contain("Incomplete");
        md.Should().Contain("Watermark notice");
        md.Should().Contain("still export");
    }

    [Fact]
    public void AppendMarkdownSection_Strong_OmitsIncompleteOnlyCallout()
    {
        StringBuilder sb = new();

        FirstValueEvidenceCompletenessMarkdownFormatter.AppendMarkdownSection(
            sb,
            FirstValueEvidenceCompletenessLevel.Strong);

        string md = sb.ToString();
        md.Should().Contain("Strong");
        md.Should().NotContain("Watermark notice");
    }

    [Fact]
    public void AppendMarkdownSection_Partial_DescribesPartialWithoutIncompleteWatermarkBlock()
    {
        StringBuilder sb = new();

        FirstValueEvidenceCompletenessMarkdownFormatter.AppendMarkdownSection(
            sb,
            FirstValueEvidenceCompletenessLevel.Partial);

        string md = sb.ToString();
        md.Should().Contain("Partial");
        md.Should().NotContain("Watermark notice");
    }
}
