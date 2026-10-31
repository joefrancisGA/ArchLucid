using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackProofPackageContractMarkdownTests
{
    [Fact]
    public void Proof_package_section_when_sendability_contains_pipe_escapes_table_cell()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                ProofSendability = "Send|able",
                PublishingTier = "Partial",
                EvidenceCompleteness = "Strong",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Proof sendability (API mirror) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Proof sendability (API mirror) | `Send\\|able` · `Partial` · `Strong` |");
    }

    [Fact]
    public void Proof_package_section_when_evidence_completeness_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                ProofSendability = "Sendable",
                PublishingTier = "Partial",
                EvidenceCompleteness = "Strong`mirror",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Proof sendability (API mirror) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("``Strong`mirror``");
    }

    [Fact]
    public void Proof_package_section_when_evidence_completeness_contains_pipe_wraps_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                ProofSendability = "Sendable",
                PublishingTier = "Partial",
                EvidenceCompleteness = "Strong|partial",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Proof sendability (API mirror) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("`Strong\\|partial`");
    }

    [Fact]
    public void Proof_package_section_when_llm_count_resolved_wraps_count_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas { LlmCallCount = 3, LlmCallCountResolved = true },
            new ProofPackageCompletenessResponse
            {
                LlmCallCountResolved = true,
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| LLM-call count |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("`3` row(s)");
        row.Should().NotContain(PilotRunDeltasLlmCallCountFormatter.ZeroSimulatorCaveatPlain);
    }

    [Fact]
    public void Proof_package_section_when_llm_count_zero_resolved_discloses_shared_simulator_caveat()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas { LlmCallCount = 0, LlmCallCountResolved = true },
            new ProofPackageCompletenessResponse
            {
                LlmCallCountResolved = true,
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| LLM-call count |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(PilotRunDeltasLlmCallCountFormatter.ZeroSimulatorCaveatPlain);
    }

    [Fact]
    public void Proof_package_llm_call_cell_when_unresolved_matches_computed_deltas_cell()
    {
        PilotRunDeltas deltas = new() { LlmCallCountResolved = false, LlmCallCount = 0 };

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            new ProofPackageCompletenessResponse
            {
                LlmCallCountResolved = false,
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder computedSb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            computedSb,
            deltas with { FindingsBySeverity = [], AuditRowCountResolved = true, AuditRowCount = 0 });

        string expectedCell = PilotRunDeltasLlmCallCountFormatter.FormatMarkdownTableCell(deltas);
        string row = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| LLM-call count |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(expectedCell);
        computedSb.ToString().Should().Contain(expectedCell);
        row.Should().NotContain("Missing — execution trace query failed");
    }

    [Fact]
    public void Proof_package_section_when_redaction_profile_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                BuyerSafeRedactionProfile = "tenant`segmented",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Buyer-safe redaction profile |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("``tenant`segmented``");
    }

    [Fact]
    public void Proof_package_section_when_roi_confidence_label_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
                RoiConfidenceLabel = "Strong`tenant",
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| ROI evidence confidence |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("``Strong`tenant``");
    }

    [Fact]
    public void Proof_package_section_when_roi_baseline_inputs_present_wraps_summary_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas(),
            new ProofPackageCompletenessResponse
            {
                RoiBaselineInputs = new PilotRoiBaselineInputsStatusResponse
                {
                    ReviewCycleHoursBasis = PilotRoiBaselineInputBasis.BuyerProvided,
                    ArchitectPrepHoursPerReviewBasis = PilotRoiBaselineInputBasis.BuyerProvided,
                    EvidenceAssemblyEffortBasis = PilotRoiBaselineInputBasis.BuyerProvided,
                    ArchitectHourlyCostBasis = PilotRoiBaselineInputBasis.BuyerProvided,
                    ProjectedDollarClaimsSponsorSafe = true,
                },
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| ROI baseline inputs (per field) |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("`review-cycle hours: buyer-provided");
    }

    [Fact]
    public void Proof_package_evidence_chain_cell_when_chain_missing_matches_trace_section_prose()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingTitle = "Gap",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = null,
        };

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            new ProofPackageCompletenessResponse
            {
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder traceSb = new();
        FirstValueReportTraceSectionFormatter.AppendEvidenceChainSection(traceSb, deltas);

        string prose = PilotTopFindingEvidenceChainHonestyCopy.UnavailableProse;
        proofSb.ToString().Should().Contain(prose);
        traceSb.ToString().Should().Contain(prose);
        proofSb.ToString().Should().NotContain("Explicitly unavailable — persisted finding");
    }

    [Fact]
    public void Proof_package_evidence_chain_cell_when_no_top_finding_uses_shared_skip_prose()
    {
        StringBuilder sb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            sb,
            new PilotRunDeltas { TopFindingId = null },
            new ProofPackageCompletenessResponse
            {
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Top finding evidence-chain pointer |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(PilotTopFindingEvidenceChainHonestyCopy.NoFindingsSkipPlain);
        row.Should().NotContain("Not applicable — no findings on this run.");
    }

    [Fact]
    public void Proof_package_evidence_chain_cell_when_chain_present_surfaces_decision_trace_pointer()
    {
        Guid decisionTraceId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        PilotRunDeltas deltas = new()
        {
            TopFindingId = "f-1",
            TopFindingTitle = "Gap",
            TopFindingSeverity = "Error",
            TopFindingEvidenceChain = new FindingEvidenceChainResponse
            {
                DecisionTraceId = decisionTraceId,
            },
        };

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            new ProofPackageCompletenessResponse
            {
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder traceSb = new();
        FirstValueReportTraceSectionFormatter.AppendEvidenceChainSection(traceSb, deltas);

        string expectedCell = PilotTopFindingEvidenceChainHonestyCopy.FormatMarkdownProofPackageCell(deltas);
        string row = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Top finding evidence-chain pointer |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(expectedCell);
        row.Should().Contain(decisionTraceId.ToString("D", System.Globalization.CultureInfo.InvariantCulture));
        traceSb.ToString().Should().Contain(decisionTraceId.ToString("D", System.Globalization.CultureInfo.InvariantCulture));
        row.Should().NotEndWith("| Present |");
    }

    [Fact]
    public void Proof_package_time_to_commit_cell_when_wall_clock_missing_matches_computed_deltas_prose()
    {
        PilotRunDeltas deltas = new()
        {
            TimeToCommittedManifest = null,
        };

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            new ProofPackageCompletenessResponse
            {
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
                TimeToCommittedManifestResolved = false,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder computedSb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            computedSb,
            new PilotRunDeltas
            {
                TimeToCommittedManifest = null,
                FindingsBySeverity = [],
                LlmCallCountResolved = true,
                AuditRowCountResolved = true,
            });

        string prose = PilotRunDeltasTimeToCommitFormatter.NoCommittedManifestWallClockPlain;
        proofSb.ToString().Should().Contain(prose);
        computedSb.ToString().Should().Contain(prose);
        string timeRow = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Time to committed manifest |", StringComparison.Ordinal))
            .TrimEnd();
        timeRow.Should().Contain(prose);
        timeRow.Should().NotContain("Not present on this run.");
    }

    [Fact]
    public void Proof_package_time_to_commit_cell_when_wall_clock_present_matches_computed_deltas_cell()
    {
        DateTime committed = new(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc);
        PilotRunDeltas deltas = new()
        {
            TimeToCommittedManifest = TimeSpan.FromHours(2),
            ManifestCommittedUtc = committed,
        };

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            new ProofPackageCompletenessResponse
            {
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
                TimeToCommittedManifestResolved = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder computedSb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            computedSb,
            deltas with { FindingsBySeverity = [], LlmCallCountResolved = true, AuditRowCountResolved = true });

        string expectedCell = PilotRunDeltasTimeToCommitFormatter.FormatMarkdownTableCell(deltas);
        string timeRow = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Time to committed manifest |", StringComparison.Ordinal))
            .TrimEnd();
        string computedRow = computedSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Time to committed manifest |", StringComparison.Ordinal))
            .TrimEnd();

        timeRow.Should().Contain(expectedCell);
        computedRow.Should().Contain(expectedCell);
        timeRow.Should().NotContain("| Present |");
    }

    [Fact]
    public void Proof_package_audit_row_cell_when_unresolved_matches_computed_deltas_cell()
    {
        PilotRunDeltas deltas = new()
        {
            AuditRowCountResolved = false,
            AuditRowCount = 0,
        };

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            new ProofPackageCompletenessResponse
            {
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
                AuditRowCountResolved = false,
                AuditRowsPresentOrLowerBound = false,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder computedSb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            computedSb,
            deltas with { FindingsBySeverity = [], LlmCallCountResolved = true });

        string expectedCell = PilotRunDeltasAuditRowCountFormatter.FormatMarkdownTableCell(deltas);
        string auditRow = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Audit-row count or lower bound |", StringComparison.Ordinal))
            .TrimEnd();

        auditRow.Should().Contain(expectedCell);
        computedSb.ToString().Should().Contain(expectedCell);
        auditRow.Should().NotContain("Not present on this run.");
    }

    [Fact]
    public void Proof_package_audit_row_cell_when_resolved_zero_matches_computed_deltas_cell()
    {
        PilotRunDeltas deltas = new()
        {
            AuditRowCountResolved = true,
            AuditRowCount = 0,
        };

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            new ProofPackageCompletenessResponse
            {
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
                AuditRowCountResolved = true,
                AuditRowsPresentOrLowerBound = false,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder computedSb = new();
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(
            computedSb,
            deltas with { FindingsBySeverity = [], LlmCallCountResolved = true });

        string zeroGap = PilotRunDeltasAuditRowCountFormatter.FormatSponsorSafeConcreteGapLineWhenZero();
        string auditRow = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Audit-row count or lower bound |", StringComparison.Ordinal))
            .TrimEnd();

        auditRow.Should().Contain(zeroGap);
        computedSb.ToString().Should().Contain("0");
        auditRow.Should().NotContain("Not present on this run.");
    }

    [Fact]
    public void Proof_package_findings_by_severity_cell_when_empty_matches_findings_section_and_pdf_copy()
    {
        PilotRunDeltas deltas = new()
        {
            AgentResultsIncludedInDetail = true,
            FindingsBySeverity = [],
        };

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            new ProofPackageCompletenessResponse
            {
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
                FindingsBySeverityPresent = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        StringBuilder findingsSb = new();
        FirstValueReportDeltasSectionFormatter.AppendFindingsSection(findingsSb, deltas);

        string plain = PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas);
        string expectedCell = PilotRunDeltasFindingsBySeverityPlainTextFormatter.FormatMarkdownProofPackageCell(deltas);
        string row = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Findings by severity |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(expectedCell);
        findingsSb.ToString().Should().Contain(plain);
        row.Should().NotContain("| Present |");
    }

    [Fact]
    public void Proof_package_findings_by_severity_cell_when_rows_present_matches_pdf_plain_formatter()
    {
        PilotRunDeltas deltas = new()
        {
            FindingsBySeverity =
            [
                new KeyValuePair<string, int>("Warning", 2),
                new KeyValuePair<string, int>("Error", 1),
            ],
        };

        StringBuilder proofSb = new();
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(
            proofSb,
            deltas,
            new ProofPackageCompletenessResponse
            {
                SupportRunIdPresent = true,
                CommittedManifestPresent = true,
                RunInCommittedStatus = true,
            },
            manifest: null,
            new ArchitectureRun { RunId = "r1", Status = ArchitectureRunStatus.Committed });

        string expectedCell = PilotRunDeltasFindingsBySeverityPlainTextFormatter.FormatMarkdownProofPackageCell(deltas);
        string row = proofSb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Findings by severity |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain(expectedCell);
        row.Should().Contain("`Warning`: 2");
        PilotRunDeltasFindingsBySeverityPlainTextFormatter.Format(deltas).Should().Contain("Warning: 2");
    }
}
