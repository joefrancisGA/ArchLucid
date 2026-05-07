using System.Text;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingTrustEvidenceCardMarkdownFormatterTests
{
    [Fact]
    public void AppendMarkdownSection_NoFinding_RendersExplicitSkip()
    {
        StringBuilder sb = new();
        PilotRunDeltas deltas = new();
        ProofPackageCompletenessResponse proof = MinimalProof();

        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proof);

        string md = sb.ToString();
        md.Should().Contain("Why this top finding is trustworthy");
        md.Should().Contain("No findings on this run");
    }

    [Fact]
    public void AppendMarkdownSection_WithChain_RendersIdsAndDoesNotClaimAttestation()
    {
        StringBuilder sb = new();
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = new FindingEvidenceChainResponse
            {
                ManifestVersion = "v3",
                FindingsSnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            },
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = false,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            ProofSendability = "Sendable",
            PublishingTier = "Complete",
        };

        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proof);

        string md = sb.ToString();
        md.Should().Contain("`f-1`");
        md.Should().Contain("`Error`");
        md.Should().Contain("v3");
        md.Should().Contain("**Not** a legal attestation");
        md.Should().Contain("No PilotStrict failures");
    }

    [Fact]
    public void AppendMarkdownSection_ChainMissing_StatesMissingExplicitly()
    {
        StringBuilder sb = new();
        PilotRunDeltas deltas = new() { TopFindingId = "f-2", TopFindingSeverity = "Warning", TopFindingEvidenceChain = null };

        ProofPackageCompletenessResponse proof = MinimalProof();

        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proof);

        sb.ToString().Should().Contain("**Missing**");
    }

    private static ProofPackageCompletenessResponse MinimalProof() =>
        new()
        {
            ProofSendability = "SendableWithCaveats",
            PublishingTier = "Partial",
        };
}
