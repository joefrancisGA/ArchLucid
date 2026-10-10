using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Metadata;
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
            TopFindingEvidenceChain =
                new FindingEvidenceChainResponse
                {
                    ManifestVersion = "v3",
                    FindingsSnapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    GoldenManifestId = null,
                },
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = false,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            ProofSendability = "Sendable", PublishingTier = "Complete", EvidenceCompleteness = "Strong",
            SponsorProofReadiness = nameof(SponsorProofReadinessClassification.Sendable),
        };

        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proof);

        string md = sb.ToString();
        md.Should().Contain("`f-1`");
        md.Should().Contain("`Error`");
        md.Should().Contain("v3");
        md.Should().Contain("Findings snapshot id");
        md.Should().Contain("Context snapshot id was not stored.");
        md.Should().Contain("Graph snapshot id was not stored.");
        md.Should().Contain("Decision trace id was not stored.");
        md.Should().Contain("Golden manifest id was not stored.");
        md.Should().Contain("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        md.Should().Contain("**Not** a legal attestation");
        md.Should().Contain("No PilotStrict failures");
        md.Should().Contain("Sponsor-proof readiness");
        md.Should().Contain("Sendable");
        md.Should().Contain("Evidence-basis label (top finding)");
        md.Should().Contain("**Evidence-backed**");
    }

    [Fact]
    public void AppendMarkdownSection_LowSupport_ShowsLowSupportLabel()
    {
        StringBuilder sb = new();
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-3",
            TopFindingSeverity = "Error",
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = true,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            AgentOutputPilotStrictEvidenceSatisfied = false,
            ProofSendability = "NotSendable",
            PublishingTier = "Partial",
            EvidenceCompleteness = "Partial",
            SponsorProofReadiness = nameof(SponsorProofReadinessClassification.Incomplete),
        };

        ArchitectureRun run = new() { RealModeFellBackToSimulator = true };

        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proof, run);

        sb.ToString().Should().Contain("**Low support**");
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

    [Fact]
    public void AppendMarkdownSection_UnrecognizedSponsorReadiness_PreservesPersistedValue()
    {
        StringBuilder sb = new();
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-4",
            TopFindingSeverity = "Warning",
        };
        ProofPackageCompletenessResponse proof = new()
        {
            ProofSendability = "SendableWithCaveats",
            PublishingTier = "Partial",
            EvidenceCompleteness = "Partial",
            SponsorProofReadiness = "not-a-classification",
        };

        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proof);

        string md = sb.ToString();
        md.Should().Contain("**Unrecognized**");
        md.Should().Contain("`not-a-classification`");
        md.Should().NotContain("Sponsor-proof readiness was not stored.");
    }

    [Fact]
    public void AppendMarkdownSection_MissingSponsorReadiness_UsesOmissionCopy()
    {
        StringBuilder sb = new();
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-5",
            TopFindingSeverity = "Warning",
        };
        ProofPackageCompletenessResponse proof = new()
        {
            ProofSendability = "SendableWithCaveats",
            PublishingTier = "Partial",
            EvidenceCompleteness = "Partial",
            SponsorProofReadiness = "  ",
        };

        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proof);

        sb.ToString().Should().Contain("Sponsor-proof readiness was not stored.");
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
