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

    [Fact]
    public void Concrete_gaps_when_audit_row_count_unresolved_matches_proof_package_and_computed_deltas_prose()
    {
        PilotRunDeltas deltas = new() { AuditRowCountResolved = false, AuditRowCount = 0 };
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            AuditRowCountResolved = false,
            AuditRowsPresentOrLowerBound = false,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NeedsOperatorReview,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string prose = PilotRunDeltasAuditRowCountFormatter.NotAttestedPlain;
        gaps.Should().Contain(prose);
        gaps.Should().NotContain("Scoped audit-event count for this run is **zero**");

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
            deltas with { FindingsBySeverity = [], LlmCallCountResolved = true });

        proofSb.ToString().Should().Contain(prose);
        computedSb.ToString().Should().Contain(prose);
    }

    [Fact]
    public void Concrete_gaps_when_evidence_chain_missing_matches_proof_package_and_trace_prose()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingTitle = "Gap",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = null,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            TopFindingEvidenceChainPresentOrNotApplicable = false,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NeedsOperatorReview,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string prose = PilotTopFindingEvidenceChainHonestyCopy.UnavailableProse;
        gaps.Should().Contain(prose);
        gaps.Should().NotContain("no resolved evidence-chain pointer");

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder traceSb = new();
        FirstValueReportTraceSectionFormatter.AppendEvidenceChainSection(traceSb, deltas);

        proofSb.ToString().Should().Contain(prose);
        traceSb.ToString().Should().Contain(prose);
    }

    [Fact]
    public void Concrete_gaps_when_artifact_descriptor_unresolved_matches_proof_package_prose()
    {
        PilotRunDeltas deltas = new() { SynthesizedArtifactDescriptorCountResolved = false };
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            ArtifactDescriptorCountResolved = false,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NeedsOperatorReview,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string prose = PilotArtifactDescriptorCountHonestyCopy.UnresolvedPlain;
        gaps.Should().Contain(prose);
        gaps.Should().NotContain("Artifact descriptor inventory did not resolve");

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
    public void Concrete_gaps_when_committed_timestamp_unresolved_matches_proof_package_prose()
    {
        PilotRunDeltas deltas = new();
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            CommittedManifestTimestampResolved = false,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NeedsOperatorReview,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string gapLine = PilotCommittedManifestTimestampHonestyCopy.FormatSponsorSafeConcreteGapLine();
        gaps.Should().Contain(gapLine);
        gaps.Should().NotContain("commit-time proof cannot be audited from metadata");

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        proofSb.ToString().Should().Contain(PilotCommittedManifestTimestampHonestyCopy.UnresolvedSuffixPlain);
        proofSb.ToString().Should().Contain(PilotCommittedManifestTimestampHonestyCopy.MetadataCreatedUtcFieldLabel);
    }

    [Fact]
    public void Concrete_gaps_when_demo_tenant_matches_proof_package_discipline_row()
    {
        PilotRunDeltas deltas = new() { IsDemoTenant = true };
        ProofPackageCompletenessResponse proof = new()
        {
            DemoTenantWarningRequired = true,
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NotSponsorSafeYet,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string failed = PilotDemoTenantDisciplineHonestyCopy.FailedPlain;
        gaps.Should().Contain(failed);
        gaps.Should().NotContain("Demo or sample tenant scope");

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        proofSb.ToString().Should().Contain(failed);
    }

    [Fact]
    public void Concrete_gaps_when_manifest_or_status_missing_matches_proof_package_row()
    {
        PilotRunDeltas deltas = new();
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = false,
            RunInCommittedStatus = false,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NotSponsorSafeYet,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Created })
            .ToList();

        string prose = PilotCommittedManifestStatusHonestyCopy.NotSponsorCompletePlain;
        gaps.Should().Contain(prose);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Created });

        string row = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Committed manifest + status |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(prose);
        row.Should().NotContain("Not present on this run.");
    }

    [Fact]
    public void Concrete_gaps_when_support_run_id_missing_matches_proof_package_row()
    {
        PilotRunDeltas deltas = new();
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = false,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NotSponsorSafeYet,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string prose = PilotSupportRunIdHonestyCopy.MissingPlain;
        gaps.Should().Contain(prose);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Support run id |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(prose);
        row.Should().NotContain("Not present on this run.");
    }

    [Fact]
    public void Concrete_gaps_when_pilot_strict_failed_matches_proof_package_row()
    {
        PilotRunDeltas deltas = new();
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            AgentOutputPilotStrictEvidenceSatisfied = false,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NotSponsorSafeYet,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string prose = PilotAgentOutputPilotStrictHonestyCopy.FailedPlain;
        gaps.Should().Contain(prose);
        gaps.Should().NotContain("do not circulate sponsor-grade real-mode assertions");

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| PilotStrict agent-output posture |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(prose);
    }

    [Fact]
    public void Concrete_gaps_when_roi_partial_matches_proof_package_row()
    {
        PilotRunDeltas deltas = new();
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Partial,
            RoiConfidenceLabel = "Defaulted from ROI model options",
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NotSponsorSafeYet,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string prose = PilotRoiEvidenceConfidenceHonestyCopy.PartialOrLowSponsorWordingPlain;
        gaps.Should().Contain(prose);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| ROI evidence confidence |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(prose);
        row.Should().Contain("Defaulted from ROI model options");
    }
}
