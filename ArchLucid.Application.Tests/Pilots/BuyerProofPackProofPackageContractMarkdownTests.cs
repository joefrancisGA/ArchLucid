using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
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
}
