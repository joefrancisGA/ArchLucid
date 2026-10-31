using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackWhyArchLucidPackMarkdownTests
{
    [Fact]
    public void Why_archlucid_pack_when_run_id_contains_pipe_preserves_inline_code()
    {
        string markdown = WhyArchLucidPackBuilder.BuildMarkdown(
            new WhyArchLucidPackSourceDto(
                RunId: "demo|run",
                ProjectId: "proj-1",
                ManifestSectionMarkdown: "_manifest_",
                AuthorityChainSectionMarkdown: "_chain_",
                ArtifactsSectionMarkdown: "_artifacts_",
                PipelineTimelineSectionMarkdown: "_timeline_",
                RunExplanationSectionMarkdown: "_explain_",
                CitationsSectionMarkdown: "_citations_",
                ComparisonDeltaSampleMarkdown: "_delta_"));

        markdown.Should().Contain("**Run id:** `demo\\|run`");
    }
}
