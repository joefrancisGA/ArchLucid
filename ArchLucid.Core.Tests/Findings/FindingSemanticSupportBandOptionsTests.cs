using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingSemanticSupportBandOptionsTests
{
    [Fact]
    public void As074_default_enable_llm_judge_is_false()
    {
        FindingSemanticSupportBandOptions options = new();

        options.EnableLlmJudge.Should().BeFalse();
    }

    [Fact]
    public void As074_section_path_is_findings_semantic_support_band()
    {
        FindingSemanticSupportBandOptions.SectionPath
            .Should()
            .Be("ArchLucid:Findings:SemanticSupportBand");
    }
}
