using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
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

    [Fact]
    public void Concrete_gaps_when_audit_zero_matches_proof_package_row()
    {
        PilotRunDeltas deltas = new()
        {
            AuditRowCountResolved = true,
            AuditRowCount = 0,
        };
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            AuditRowCountResolved = true,
            AuditRowsPresentOrLowerBound = false,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NotSponsorSafeYet,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string prose = PilotRunDeltasAuditRowCountFormatter.FormatSponsorSafeConcreteGapLineWhenZero();
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
            .Single(line => line.Contains("| Audit-row count or lower bound |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(prose);
    }

    [Fact]
    public void Concrete_gaps_when_simulator_substitution_matches_proof_package_evidence_basis_row()
    {
        PilotRunDeltas deltas = new();
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            AgentOutputPilotStrictEvidenceSatisfied = true,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
        };

        ArchitectureRun run = new()
        {
            RunId = "r1",
            Status = ArchitectureRunStatus.Committed,
            RealModeFellBackToSimulator = true,
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.NeedsOperatorReview,
                proof,
                deltas,
                run)
            .ToList();

        string prose = PilotSimulatorSubstitutionHonestyCopy.ConcreteGapPlain;
        gaps.Should().Contain(prose);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            run);

        string row = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Evidence-basis labels |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(prose);
    }

    [Fact]
    public void Execution_mode_blockquote_when_simulator_matches_concrete_gap_prose()
    {
        ArchitectureRun run = new()
        {
            RunId = "r1",
            Status = ArchitectureRunStatus.Committed,
            RealModeFellBackToSimulator = true,
        };

        StringBuilder execSb = new();
        SponsorExecutionModeMarkdownFormatter.AppendMarkdownSection(execSb, run);

        string prose = PilotSimulatorSubstitutionHonestyCopy.ConcreteGapPlain;
        execSb.ToString().Should().Contain(prose);
        execSb.ToString().Should().NotContain("unqualified live-model proof");
    }

    [Fact]
    public void Sponsor_proof_readiness_when_unresolved_matches_proof_package_row()
    {
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            SponsorProofReadiness = "not-a-classification",
        };

        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.Partial,
            ProofPackageSendability.SendableWithCaveats,
            [],
            [],
            []);

        StringBuilder statusSb = new();
        SponsorSafeProofStatusMarkdownFormatter.AppendMarkdownSection(
            statusSb,
            SponsorSafeProofDisposition.NeedsOperatorReview,
            gate,
            proof,
            new PilotRunDeltas(),
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            new PilotRunDeltas(),
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string prose = PilotSponsorProofReadinessUnresolvedHonestyCopy.UnresolvedPlain;
        statusSb.ToString().Should().Contain(prose);
        statusSb.ToString().Should().NotContain("classification unavailable");

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Sponsor-proof readiness (classification) |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);
    }

    [Fact]
    public void Concrete_gaps_when_sendable_matches_proof_package_sendability_row()
    {
        PilotRunDeltas deltas = new()
        {
            AuditRowCount = 3,
            AuditRowCountResolved = true,
            LlmCallCountResolved = true,
            SynthesizedArtifactDescriptorCountResolved = true,
            SynthesizedArtifactDescriptorCount = 1,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            CommittedManifestTimestampResolved = true,
            RunInCommittedStatus = true,
            ArtifactDescriptorCount = 1,
            ArtifactDescriptorCountResolved = true,
            TimeToCommittedManifestResolved = true,
            TopFindingEvidenceChainPresentOrNotApplicable = true,
            AuditRowsPresentOrLowerBound = true,
            LlmCallCountResolved = true,
            AgentOutputPilotStrictEvidenceSatisfied = true,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
            ProofSendability = nameof(ProofPackageSendability.Sendable),
            PublishingTier = "Complete",
            EvidenceCompleteness = "Strong",
        };

        List<string> gaps = SponsorSafeProofStatusMarkdownFormatter
            .EnumerateConcreteGapsEnumerable(
                SponsorSafeProofDisposition.Sendable,
                proof,
                deltas,
                new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed })
            .ToList();

        string prose = PilotSponsorSafeSendableAllClearHonestyCopy.AllClearConcreteGapPlain;
        gaps.Should().ContainSingle().Which.Should().Be(prose);

        StringBuilder proofSb = new();
        GoldenManifest manifest = new() { Metadata = new ManifestMetadata { CreatedUtc = DateTime.UtcNow } };
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Proof sendability (API mirror) |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);
    }

    [Fact]
    public void Gate_mirrors_when_sendable_matches_proof_package_sendability_mirror_suffix()
    {
        PilotRunDeltas deltas = new()
        {
            AuditRowCount = 3,
            AuditRowCountResolved = true,
            LlmCallCountResolved = true,
            SynthesizedArtifactDescriptorCountResolved = true,
            SynthesizedArtifactDescriptorCount = 1,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            CommittedManifestTimestampResolved = true,
            RunInCommittedStatus = true,
            ArtifactDescriptorCount = 1,
            ArtifactDescriptorCountResolved = true,
            TimeToCommittedManifestResolved = true,
            TopFindingEvidenceChainPresentOrNotApplicable = true,
            AuditRowsPresentOrLowerBound = true,
            LlmCallCountResolved = true,
            AgentOutputPilotStrictEvidenceSatisfied = true,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
            ProofSendability = nameof(ProofPackageSendability.Sendable),
            PublishingTier = "Complete",
            EvidenceCompleteness = "Strong",
        };

        PilotBuyerSafeEvidenceGateResult gate = new(
            PilotBuyerSafeEvidencePublishingTier.Complete,
            ProofPackageSendability.Sendable,
            [],
            [],
            []);

        StringBuilder statusSb = new();
        SponsorSafeProofStatusMarkdownFormatter.AppendMarkdownSection(
            statusSb,
            SponsorSafeProofDisposition.Sendable,
            gate,
            proof,
            deltas,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: new GoldenManifest { Metadata = new ManifestMetadata { CreatedUtc = DateTime.UtcNow } },
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string mirrorCell = PilotSponsorSafeSendableAllClearHonestyCopy.FormatProofSendabilityMirrorCell(proof);
        string prose = PilotSponsorSafeSendableAllClearHonestyCopy.AllClearConcreteGapPlain;

        statusSb.ToString().Should().Contain("**Gate mirrors (structured):**");
        statusSb.ToString().Should().Contain(prose);

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Proof sendability (API mirror) |", StringComparison.Ordinal))
            .Should()
            .Contain(mirrorCell);

        statusSb.ToString().Should().Contain("`Sendable`");
        statusSb.ToString().Should().Contain("`Complete`");
    }

    [Fact]
    public void Evidence_basis_verdict_labels_match_proof_package_when_simulator_substitution()
    {
        PilotRunDeltas deltas = new();
        ProofPackageCompletenessResponse proof = new()
        {
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
            AgentOutputPilotStrictEvidenceSatisfied = true,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
        };

        ArchitectureRun run = new()
        {
            RunId = "r1",
            Status = ArchitectureRunStatus.Committed,
            RealModeFellBackToSimulator = true,
        };

        StringBuilder verdictSb = new();
        SponsorEvidenceBasisVerdictMarkdownFormatter.AppendMarkdownSection(verdictSb, proof, deltas, run);

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(proofSb, deltas, proof, manifest: null, run);

        string prose = PilotSimulatorSubstitutionHonestyCopy.ConcreteGapPlain;

        verdictSb.ToString().Should().Contain(prose);

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Evidence-basis labels |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);
    }

    [Fact]
    public void Sponsor_status_quality_disposition_matches_proof_package_pilot_strict_row()
    {
        ProofPackageCompletenessResponse proof = new()
        {
            AgentOutputPilotStrictEvidenceSatisfied = false,
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
        };

        StringBuilder statusSb = new();
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            statusSb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.NotSponsorSafeYet,
            proof,
            new PilotRunDeltas(),
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed },
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Hold,
                PilotRoiEvidenceConfidence.Low,
                "",
                false,
                "Hold",
                "Hold narrative"));

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            new PilotRunDeltas(),
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string prose = PilotAgentOutputPilotStrictHonestyCopy.FailedPlain;

        statusSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Quality disposition |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| PilotStrict agent-output posture |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);
    }

    [Fact]
    public void Sponsor_status_audit_row_basis_matches_proof_package_when_unresolved()
    {
        PilotRunDeltas deltas = new() { AuditRowCountResolved = false, AuditRowCount = 0 };
        ProofPackageCompletenessResponse proof = new()
        {
            AuditRowCountResolved = false,
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
        };

        StringBuilder statusSb = new();
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            statusSb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.NeedsOperatorReview,
            proof,
            deltas,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed },
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Hold,
                PilotRoiEvidenceConfidence.Low,
                "",
                false,
                "Hold",
                "Hold narrative"));

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string expected = PilotRunDeltasAuditRowCountFormatter.FormatProofPackageCell(deltas, proof);

        statusSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Audit row basis |", StringComparison.Ordinal))
            .Should()
            .Contain(expected);

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Audit-row count or lower bound |", StringComparison.Ordinal))
            .Should()
            .Contain(expected);
    }

    [Fact]
    public void Sponsor_status_llm_call_basis_matches_proof_package_when_unresolved()
    {
        PilotRunDeltas deltas = new() { LlmCallCountResolved = false, LlmCallCount = 0 };
        ProofPackageCompletenessResponse proof = new()
        {
            LlmCallCountResolved = false,
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
        };

        StringBuilder statusSb = new();
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            statusSb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.NeedsOperatorReview,
            proof,
            deltas,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed },
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Hold,
                PilotRoiEvidenceConfidence.Low,
                "",
                false,
                "Hold",
                "Hold narrative"));

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string expected = PilotRunDeltasLlmCallCountFormatter.FormatProofPackageCell(deltas, proof);

        statusSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| LLM call basis |", StringComparison.Ordinal))
            .Should()
            .Contain(expected);

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| LLM-call count |", StringComparison.Ordinal))
            .Should()
            .Contain(expected);
    }

    [Fact]
    public void Sponsor_status_evidence_source_matches_proof_discipline_when_demo_tenant()
    {
        ProofPackageCompletenessResponse proof = new()
        {
            DemoTenantWarningRequired = true,
            SupportRunIdPresent = true,
            CommittedManifestPresent = true,
            RunInCommittedStatus = true,
        };

        StringBuilder statusSb = new();
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            statusSb,
            new ArchitectureRunDetail(),
            SponsorSafeProofDisposition.NotSponsorSafeYet,
            proof,
            new PilotRunDeltas { IsDemoTenant = true },
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed },
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Hold,
                PilotRoiEvidenceConfidence.Low,
                "",
                false,
                "Hold",
                "Hold narrative"));

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            new PilotRunDeltas { IsDemoTenant = true },
            proof,
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string prose = PilotDemoTenantDisciplineHonestyCopy.FailedPlain;

        statusSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Evidence source |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);

        proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Non-demo / external-share discipline |", StringComparison.Ordinal))
            .Should()
            .Contain(prose);
    }
}
