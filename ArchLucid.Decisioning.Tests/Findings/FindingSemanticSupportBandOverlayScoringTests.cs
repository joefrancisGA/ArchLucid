using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandOverlayScoringTests
{
    [Fact]
    public void ScoreFinding_hashes_evidence_refs_and_preserves_existing_band()
    {
        Finding finding = new()
        {
            FindingId = "f-1",
            Title = "Title",
            Rationale = "Firewall allows public ingress on database subnet.",
            SemanticSupportBand = FindingSemanticSupportBand.NotScored,
            EvidenceRefs = ["doc:subnet-policy — deny public database ingress."],
        };

        FindingSemanticSupportBandOverlayScoreResult score = FindingSemanticSupportBandOverlayScoring.ScoreFinding(finding);

        score.Band.Should().Be(FindingSemanticSupportBand.NotScored);
        score.ScorerVersion.Should().Be(FindingSemanticSupportBandScorerVersions.As057QuoteOverlapV1);
        score.EvidenceExcerptHashSha256.Should().NotBeNullOrWhiteSpace();
        score.EvidenceExcerptHashSha256!.Length.Should().Be(64);
    }

    [Fact]
    public void ScoreFinding_stamps_supplied_scorer_version_without_rescoring_assigned_band()
    {
        Finding finding = new()
        {
            FindingId = "f-llm",
            Title = "Paraphrase",
            Rationale = "Storefront TLS terminates at the gateway.",
            SemanticSupportBand = FindingSemanticSupportBand.Supported,
            EvidenceRefs = ["The API gateway terminates TLS for the storefront."],
        };

        FindingSemanticSupportBandOverlayScoreResult score = FindingSemanticSupportBandOverlayScoring.ScoreFinding(
            finding,
            FindingSemanticSupportBandScorerVersions.As099LlmFinalizeV1);

        score.Band.Should().Be(FindingSemanticSupportBand.Supported);
        score.ScorerVersion.Should().Be(FindingSemanticSupportBandScorerVersions.As099LlmFinalizeV1);
    }
}
