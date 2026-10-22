using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandScorerTests
{
    [Fact]
    public void Score_exact_quote_overlap_returns_supported()
    {
        const string citation =
            "The API gateway terminates TLS and forwards traffic to the internal router service.";

        const string finding =
            "The API gateway terminates TLS and forwards traffic to the internal router service.";

        FindingSemanticSupportBand band = FindingSemanticSupportBandScorer.Score(
            finding,
            [citation]);

        band.Should().Be(FindingSemanticSupportBand.Supported);
    }

    [Fact]
    public void Score_disjoint_content_tokens_returns_unsupported()
    {
        const string citation =
            "Kubernetes ingress controller exposes the storefront workload on port 443.";

        const string finding =
            "PostgreSQL firewall rules allow unrestricted storage account access from the public internet.";

        FindingSemanticSupportBand band = FindingSemanticSupportBandScorer.Score(
            finding,
            [citation]);

        band.Should().Be(FindingSemanticSupportBand.Unsupported);
    }

    [Fact]
    public void Score_paraphrase_with_partial_overlap_returns_unchecked()
    {
        const string citation =
            "The API gateway terminates TLS and forwards traffic to the internal router service.";

        const string finding =
            "Gateway layer provides encrypted transport before requests reach the router tier.";

        FindingSemanticSupportBand band = FindingSemanticSupportBandScorer.Score(
            finding,
            [citation]);

        band.Should().Be(FindingSemanticSupportBand.Unchecked);
    }

    [Fact]
    public void Score_empty_citations_returns_not_scored_for_provenance_gate()
    {
        FindingSemanticSupportBand band = FindingSemanticSupportBandScorer.Score(
            "Firewall allows public ingress on database subnet.",
            []);

        band.Should().Be(FindingSemanticSupportBand.NotScored);
    }

    [Fact]
    public void Score_multiple_citation_excerpts_checks_combined_blob()
    {
        const string docExcerpt = "doc:architecture-overview — subnet isolation is required for payment data.";
        const string diagramExcerpt = "diagram:payment-flow — gateway forwards authenticated requests only.";

        const string finding = "subnet isolation is required for payment data.";

        FindingSemanticSupportBand band = FindingSemanticSupportBandScorer.Score(
            finding,
            [docExcerpt, diagramExcerpt]);

        band.Should().Be(FindingSemanticSupportBand.Supported);
    }
}
