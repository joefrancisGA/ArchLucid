using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSponsorSafeProofStatusGapsMarkdownTests
{
    [Fact]
    public void Concrete_gaps_when_wall_clock_missing_matches_proof_package_and_computed_deltas_prose()
    {
        PilotRunDeltas deltas = new() { TimeToCommittedManifest = null };
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            TimeToCommittedManifestResolved = false,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NeedsOperatorReview,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string prose = PilotRunDeltasTimeToCommitFormatter.NoCommittedManifestWallClockPlain;
        gaps.Should().Contain(prose);
        gaps.Should().NotContain("Time-to-committed-manifest is unresolved");

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        proofSb.ToString().Should().Contain(prose);
    }

    [Fact]
    public void Concrete_gaps_when_llm_count_unresolved_matches_proof_package_and_computed_deltas_prose()
    {
        PilotRunDeltas deltas = new() { LlmCallCountResolved = false };
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            LlmCallCountResolved = false,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NeedsOperatorReview,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string gapLine = PilotRunDeltasLlmCallCountFormatter.FormatSponsorSafeConcreteGapLine();
        string tableCell = PilotRunDeltasLlmCallCountFormatter.FormatMarkdownTableCell(deltas);
        gaps.Should().Contain(gapLine);
        gaps.Should().Contain(g => g.Contains(PilotRunDeltasLlmCallCountFormatter.NotAttestedPlain, StringComparison.Ordinal));
        gaps.Should().NotContain("LLM-call count is unattested");

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder computedSb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            computedSb,
            deltas with { FindingsBySeverity = [], AuditRowCountResolved = true, AuditRowCount = 0 });

        proofSb.ToString().Should().Contain(tableCell);
        computedSb.ToString().Should().Contain(tableCell);
    }
}
