using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class WhyArchLucidPackBuilderTests
{
    [SkippableFact]
    public void BuildMarkdown_includes_benchmarked_differentiation_table_and_demo_banner()
    {
        WhyArchLucidPackSourceDto source = new(
            runId: "run",
            projectId: "proj",
            manifestSectionMarkdown: "| a | b |\n|---|---|\n| x | y |",
            authorityChainSectionMarkdown: "| id | v |\n|----|---|\n| a | b |",
            artifactsSectionMarkdown: "_none_",
            pipelineTimelineSectionMarkdown: "_none_",
            runExplanationSectionMarkdown: "**Summary**\n\nhello",
            citationsSectionMarkdown: "_none_",
            comparisonDeltaSampleMarkdown: "- theme");

        string md = WhyArchLucidPackBuilder.BuildMarkdown(source);

        md.Should().Contain("Five capability claims, every claim cited to a file in this repository or to an external public source.");
        md.Should().Contain("| Claim | ArchLucid evidence | Competitor baseline | Citation | Narrative (\u22644 sentences) |");
        md.Should().Contain("GET /v1/authority/runs/{runId}/provenance");
        md.Should().Contain("demo tenant \u2014 replace before publishing");
        md.Should().Contain("`run`");
    }
}
