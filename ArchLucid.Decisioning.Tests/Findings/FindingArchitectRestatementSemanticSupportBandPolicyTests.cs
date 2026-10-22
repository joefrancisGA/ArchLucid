using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingArchitectRestatementSemanticSupportBandPolicyTests
{
    [Fact]
    public void ResolveEffectiveClaimBand_keeps_unsupported_when_restatement_quotes_citations()
    {
        const string citation =
            "The API gateway terminates TLS and forwards traffic to the internal router service.";

        const string unsupportedClaim =
            "PostgreSQL firewall rules allow unrestricted storage account access from the public internet.";

        const string restatement =
            "The API gateway terminates TLS and forwards traffic to the internal router service.";

        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Title = "Storage exposure",
            Rationale = unsupportedClaim,
            EvidenceRefs = [citation],
        };

        FindingSemanticSupportBand effectiveBand =
            FindingArchitectRestatementSemanticSupportBandPolicy.ResolveEffectiveClaimBand(
                finding,
                restatement,
                [citation]);

        effectiveBand.Should().Be(FindingSemanticSupportBand.Unsupported);
    }

    [Fact]
    public void ResolveRestatementHumanBand_never_returns_supported_even_with_exact_quote_overlap()
    {
        const string citation =
            "The API gateway terminates TLS and forwards traffic to the internal router service.";

        const string restatement = citation;

        FindingSemanticSupportBand restatementBand =
            FindingArchitectRestatementSemanticSupportBandPolicy.ResolveRestatementHumanBand(
                restatement,
                [citation]);

        restatementBand.Should().Be(FindingSemanticSupportBand.NotScored);
        restatementBand.Should().NotBe(FindingSemanticSupportBand.Supported);
    }

    [Fact]
    public void Resolve_splits_claim_band_from_restatement_human_band()
    {
        const string citation =
            "The API gateway terminates TLS and forwards traffic to the internal router service.";

        const string unsupportedClaim =
            "PostgreSQL firewall rules allow unrestricted storage account access from the public internet.";

        const string restatement = citation;

        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Title = "Gateway posture",
            Rationale = unsupportedClaim,
            EvidenceRefs = [citation],
        };

        FindingArchitectRestatementSemanticSupportBandResolution resolution =
            FindingArchitectRestatementSemanticSupportBandPolicy.Resolve(
                finding,
                restatement,
                [citation]);

        resolution.ClaimBand.Should().Be(FindingSemanticSupportBand.Unsupported);
        resolution.RestatementHumanBand.Should().Be(FindingSemanticSupportBand.NotScored);
    }

    [Fact]
    public void ResolveClaimBand_ignores_architect_restatement_parameter_by_design()
    {
        const string citation =
            "Kubernetes ingress controller exposes the storefront workload on port 443.";

        const string claim =
            "PostgreSQL firewall rules allow unrestricted storage account access from the public internet.";

        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Title = "Storage exposure",
            Rationale = claim,
            EvidenceRefs = [citation],
        };

        FindingSemanticSupportBand claimBand =
            FindingArchitectRestatementSemanticSupportBandPolicy.ResolveClaimBand(finding, [citation]);

        claimBand.Should().Be(FindingSemanticSupportBand.Unsupported);
    }

    [Fact]
    public void CapRestatementHumanBand_maps_supported_to_not_scored()
    {
        FindingArchitectRestatementSemanticSupportBandPolicy
            .CapRestatementHumanBand(FindingSemanticSupportBand.Supported)
            .Should()
            .Be(FindingSemanticSupportBand.NotScored);
    }

    [Fact]
    public void CapRestatementHumanBand_preserves_non_supported_bands()
    {
        FindingArchitectRestatementSemanticSupportBandPolicy
            .CapRestatementHumanBand(FindingSemanticSupportBand.Unsupported)
            .Should()
            .Be(FindingSemanticSupportBand.Unsupported);
    }
}
