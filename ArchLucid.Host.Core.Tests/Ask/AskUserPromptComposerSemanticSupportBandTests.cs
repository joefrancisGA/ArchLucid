using ArchLucid.Application.Ask;
using ArchLucid.Contracts.Findings;
using ArchLucid.Host.Core.Services.Ask;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Category", "Unit")]
public sealed class AskUserPromptComposerSemanticSupportBandTests
{
    [Fact]
    public void BuildUserPrompt_includes_semantic_support_band_constraint_when_index_present()
    {
        string prompt = AskUserPromptComposer.BuildUserPrompt(
            contextJson: """{"decisions":[]}""",
            retrievalContext: null,
            retrievalDegraded: false,
            historyText: null,
            question: "Summarize unsupported ingress findings",
            findingBandIndex:
            [
                new AskCitedFindingsSemanticSupportBandHonesty.FindingBandIndexEntry(
                    "f-1",
                    "Public database ingress",
                    FindingSemanticSupportBand.Unsupported),
            ]);

        prompt.Should().Contain(AskCitedFindingsSemanticSupportBandHonesty.PromptConstraintPrefix);
        prompt.Should().Contain("f-1: Unsupported");
        prompt.Should().Contain("TB-1003");
        prompt.Should().Contain("must not sound more certain");
    }

    [Fact]
    public void BuildUserPrompt_omits_semantic_support_section_when_index_empty()
    {
        string prompt = AskUserPromptComposer.BuildUserPrompt(
            contextJson: "{}",
            retrievalContext: null,
            retrievalDegraded: false,
            historyText: null,
            question: "What changed?",
            findingBandIndex: []);

        prompt.Should().NotContain(AskCitedFindingsSemanticSupportBandHonesty.PromptConstraintPrefix);
    }
}
