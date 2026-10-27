using ArchLucid.Application.Analysis;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports.ArchitectureReviewBoard;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureReviewBoardExportDocumentFactoryGovernanceTests
{
    [Fact]
    public void Create_system_overview_uses_not_stored_labels_for_default_moderate_governance_only()
    {
        GoldenManifest manifest = new()
        {
            RunId = ArchitectureReviewBoardExportPipelineFixture.SyntheticRunId,
            SystemName = "Payments",
            Governance = new ManifestGovernance
            {
                RiskClassification = "Moderate",
                CostClassification = "Moderate",
            },
        };

        (ArchitectureRunDetail detail, ArchitectureAnalysisReport report) =
            ArchitectureReviewBoardExportPipelineFixture.CreateSyntheticFinalizedReview();
        detail.Manifest = manifest;
        report.Manifest = manifest;

        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportDocumentFactory.Create(
            detail,
            report,
            httpCorrelationId: null,
            extractorTimestampUtcLabel: null);

        model.SystemOverviewBullets.Should().ContainSingle(line =>
            line.Contains(ArchitectureManifestGovernanceExport.RiskClassificationNotStoredLabel, StringComparison.Ordinal)
            && line.Contains(ArchitectureManifestGovernanceExport.CostClassificationNotStoredLabel, StringComparison.Ordinal));
    }

    [Fact]
    public void Create_policy_findings_labels_governance_constraint_rows()
    {
        GoldenManifest manifest = new()
        {
            RunId = ArchitectureReviewBoardExportPipelineFixture.SyntheticRunId,
            SystemName = "Payments",
            Governance = new ManifestGovernance
            {
                PolicyConstraints = ["Encrypt customer data at rest."],
            },
        };

        (ArchitectureRunDetail detail, ArchitectureAnalysisReport report) =
            ArchitectureReviewBoardExportPipelineFixture.CreateSyntheticFinalizedReview();
        detail.Manifest = manifest;
        report.Manifest = manifest;

        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportDocumentFactory.Create(
            detail,
            report,
            httpCorrelationId: null,
            extractorTimestampUtcLabel: null);

        model.PolicyFindings.Should().Contain(row =>
            row.PolicyPackNameOrId == "Governance constraint"
            && row.Detail == "Encrypt customer data at rest.");
    }

    [Fact]
    public void Create_key_risks_omits_governance_row_when_risk_classification_was_not_stored()
    {
        GoldenManifest manifest = new()
        {
            RunId = ArchitectureReviewBoardExportPipelineFixture.SyntheticRunId,
            SystemName = "Payments",
            Governance = new ManifestGovernance
            {
                RiskClassification = "Moderate",
                CostClassification = "Moderate",
            },
        };

        (ArchitectureRunDetail detail, ArchitectureAnalysisReport report) =
            ArchitectureReviewBoardExportPipelineFixture.CreateSyntheticFinalizedReview();
        detail.Manifest = manifest;
        report.Manifest = manifest;
        report.Warnings = [];

        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportDocumentFactory.Create(
            detail,
            report,
            httpCorrelationId: null,
            extractorTimestampUtcLabel: null);

        model.KeyRisks.Should().NotContain(risk => risk.SeverityLabel == "Governance");
    }

    [Fact]
    public void Create_system_overview_uses_compliance_tags_not_stored_label_when_empty()
    {
        GoldenManifest manifest = new()
        {
            RunId = ArchitectureReviewBoardExportPipelineFixture.SyntheticRunId,
            SystemName = "Payments",
            Governance = new ManifestGovernance
            {
                RiskClassification = "High",
                CostClassification = "Low",
            },
        };

        (ArchitectureRunDetail detail, ArchitectureAnalysisReport report) =
            ArchitectureReviewBoardExportPipelineFixture.CreateSyntheticFinalizedReview();
        detail.Manifest = manifest;
        report.Manifest = manifest;

        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportDocumentFactory.Create(
            detail,
            report,
            httpCorrelationId: null,
            extractorTimestampUtcLabel: null);

        model.SystemOverviewBullets.Should().ContainSingle(line =>
            line.Contains(ArchitectureManifestGovernanceExport.ComplianceTagsNotStoredLabel, StringComparison.Ordinal));
    }

    [Fact]
    public void Create_evidence_reviewed_includes_request_narrative_not_stored_when_blank()
    {
        (ArchitectureRunDetail detail, ArchitectureAnalysisReport report) =
            ArchitectureReviewBoardExportPipelineFixture.CreateSyntheticFinalizedReview();
        report.Evidence!.Request.Description = "   ";

        ArchitectureReviewBoardExportDocumentModel model = ArchitectureReviewBoardExportDocumentFactory.Create(
            detail,
            report,
            httpCorrelationId: null,
            extractorTimestampUtcLabel: null);

        model.EvidenceReviewed.Should().Contain(item =>
            item.Title == "Request narrative" && item.Detail == "Request narrative was not stored.");
    }
}
