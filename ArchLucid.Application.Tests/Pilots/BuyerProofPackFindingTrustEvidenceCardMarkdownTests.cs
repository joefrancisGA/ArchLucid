using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackFindingTrustEvidenceCardMarkdownTests
{
    [Fact]
    public void Evidence_card_when_manifest_version_contains_pipe_escapes_table_cell()
    {
        StringBuilder sb = new();
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-pipe",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = new FindingEvidenceChainResponse { ManifestVersion = "v2|beta" },
        };

        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, MinimalProof());

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Manifest version (chain) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Manifest version (chain) | `v2\\|beta` |");
    }

    [Fact]
    public void Evidence_card_when_unrecognized_readiness_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingSeverity = "Warning",
        };

        ProofPackageCompletenessResponse proof = new()
        {
            ProofSendability = "Sendable",
            PublishingTier = "Partial",
            EvidenceCompleteness = "Partial",
            SponsorProofReadiness = "tier`broken",
        };

        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proof);

        sb.ToString().Should().Contain("``tier`broken``");
    }

    [Fact]
    public void Evidence_card_when_chain_missing_uses_shared_unavailable_prose()
    {
        StringBuilder sb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas
            {
                TopFindingId = "f-1",
                TopFindingSeverity = "Error",
                TopFindingEvidenceChain = null,
            },
            MinimalProof());

        string md = sb.ToString();
        md.Should().Contain(PilotTopFindingEvidenceChainHonestyCopy.UnavailableProse);
        md.Should().NotContain("did not resolve to a persisted chain");
    }

    [Fact]
    public void Evidence_card_when_no_top_finding_aligns_with_trace_section_skip_prose()
    {
        PilotRunDeltas deltas = new() { TopFindingId = null };

        StringBuilder traceSb = new();
        FirstValueReportTraceSectionFormatter.AppendEvidenceChainSection(traceSb, deltas);

        StringBuilder cardSb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(cardSb, deltas, MinimalProof());

        string prose = PilotTopFindingEvidenceChainHonestyCopy.NoFindingsSkipPlain;
        traceSb.ToString().Should().Contain(prose);
        cardSb.ToString().Should().Contain(prose);
        cardSb.ToString().Should().NotContain("no top-severity evidence card");
    }

    [Fact]
    public void Evidence_card_when_severity_empty_uses_not_stored_copy()
    {
        StringBuilder sb = new();
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas
            {
                TopFindingId = "f-1",
                TopFindingTitle = "Gap",
                TopFindingSeverity = "",
            },
            MinimalProof());

        sb.ToString().Should().Contain(PilotTopFindingPresentationHonestyCopy.SeverityNotStored);
    }

    private static ProofPackageCompletenessResponse MinimalProof() =>
        new()
        {
            ProofSendability = "SendableWithCaveats",
            PublishingTier = "Partial",
            EvidenceCompleteness = "Partial",
            SponsorProofReadiness = nameof(SponsorProofReadinessClassification.Incomplete),
        };
}
