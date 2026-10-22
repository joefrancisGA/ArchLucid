using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandLlmJudgmentFaithfulnessValidatorTests
{
    [Fact]
    public void IsAcceptable_rejects_supported_invented_from_unsupported_heuristic()
    {
        FindingSemanticSupportBandLlmJudgmentFaithfulnessValidator
            .IsAcceptable(FindingSemanticSupportBand.Supported, FindingSemanticSupportBand.Unsupported)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsAcceptable_rejects_demoting_exact_quote_supported_to_unsupported()
    {
        FindingSemanticSupportBandLlmJudgmentFaithfulnessValidator
            .IsAcceptable(FindingSemanticSupportBand.Unsupported, FindingSemanticSupportBand.Supported)
            .Should()
            .BeFalse();
    }

    [Theory]
    [InlineData(FindingSemanticSupportBand.Supported, FindingSemanticSupportBand.Unchecked)]
    [InlineData(FindingSemanticSupportBand.Unchecked, FindingSemanticSupportBand.Unsupported)]
    [InlineData(FindingSemanticSupportBand.Unchecked, FindingSemanticSupportBand.Supported)]
    [InlineData(FindingSemanticSupportBand.Unsupported, FindingSemanticSupportBand.Unchecked)]
    [InlineData(FindingSemanticSupportBand.Supported, FindingSemanticSupportBand.Supported)]
    [InlineData(FindingSemanticSupportBand.Unchecked, FindingSemanticSupportBand.Unchecked)]
    public void IsAcceptable_allows_paraphrase_and_same_band(
        FindingSemanticSupportBand llmBand,
        FindingSemanticSupportBand heuristicBand)
    {
        FindingSemanticSupportBandLlmJudgmentFaithfulnessValidator
            .IsAcceptable(llmBand, heuristicBand)
            .Should()
            .BeTrue();
    }
}
