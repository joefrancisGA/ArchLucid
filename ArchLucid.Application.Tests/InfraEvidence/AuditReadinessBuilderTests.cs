using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AuditReadinessBuilderTests
{
    [Fact]
    public void BuildControlReadiness_passing_eval_with_stale_evidence_is_not_ready_for_auditor_review()
    {
        Guid controlId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();

        AuditControlRecord control = new()
        {
            ControlId = controlId,
            ControlNumber = "AC-1",
            Title = "Access control policy",
        };

        AuditEvidenceRequirementRecord requirement = new()
        {
            RequirementId = requirementId,
            ControlId = controlId,
            EvidenceType = AuditEvidenceTypeNames.Inventory,
            Name = "Inventory",
        };

        AuditEvidenceSnapshotItemRecord evidenceItem = new()
        {
            RequirementId = requirementId,
            CollectionStatus = AuditEvidenceCollectionStatus.Collected,
            FreshnessStatus = AuditEvidenceFreshnessStatus.Stale,
            EvidenceType = AuditEvidenceTypeNames.Inventory,
            Summary = "stale inventory",
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };

        AuditControlEvaluationRecord evaluation = new()
        {
            ControlId = controlId,
            Outcome = AuditEvaluationOutcome.TechnicallySupported,
            EvaluationText = "Technically supported.",
        };

        AuditControlReadinessRecord readiness = AuditReadinessBuilder.BuildControlReadiness(
            control,
            [requirement],
            [evidenceItem],
            evaluation);

        readiness.AutomatedEvaluationOutcome.Should().Be(AuditEvaluationOutcome.TechnicallySupported);
        readiness.Completeness.Should().Be(AuditControlEvidenceCompleteness.FullyEvident);
        readiness.WorstFreshnessStatus.Should().Be(AuditEvidenceFreshnessStatus.Stale);
        readiness.ReadyForAuditorReview.Should().BeFalse();
        readiness.OutstandingActions.Should().Contain(action =>
            action.Contains("stale", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void BuildControlReadiness_passing_eval_with_current_evidence_is_ready_for_auditor_review()
    {
        Guid controlId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();

        AuditControlRecord control = new()
        {
            ControlId = controlId,
            ControlNumber = "AC-2",
            Title = "Account management",
        };

        AuditEvidenceRequirementRecord requirement = new()
        {
            RequirementId = requirementId,
            ControlId = controlId,
            EvidenceType = AuditEvidenceTypeNames.Inventory,
            Name = "Inventory",
        };

        AuditEvidenceSnapshotItemRecord evidenceItem = new()
        {
            RequirementId = requirementId,
            CollectionStatus = AuditEvidenceCollectionStatus.Collected,
            FreshnessStatus = AuditEvidenceFreshnessStatus.Current,
            EvidenceType = AuditEvidenceTypeNames.Inventory,
            Summary = "current inventory",
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };

        AuditControlEvaluationRecord evaluation = new()
        {
            ControlId = controlId,
            Outcome = AuditEvaluationOutcome.TechnicallySupported,
            EvaluationText = "Technically supported.",
        };

        AuditControlReadinessRecord readiness = AuditReadinessBuilder.BuildControlReadiness(
            control,
            [requirement],
            [evidenceItem],
            evaluation);

        readiness.ReadyForAuditorReview.Should().BeTrue();
        readiness.OutstandingActions.Should().BeEmpty();
    }

    [Fact]
    public void BuildAssessmentSummary_default_aggregate_label_is_not_compliance_score()
    {
        AuditControlReadinessRecord control = new()
        {
            ControlId = Guid.NewGuid(),
            ControlNumber = "AC-1",
            Applicability = AuditControlApplicabilityStatus.Applicable,
            Completeness = AuditControlEvidenceCompleteness.FullyEvident,
            WorstFreshnessStatus = AuditEvidenceFreshnessStatus.Current,
            AutomatedEvaluationOutcome = AuditEvaluationOutcome.TechnicallySupported,
            ReadyForAuditorReview = true,
        };

        string aggregateLabel = AuditReadinessLabels.ResolveAggregateLabel(catalogAllowsComplianceScoreAggregate: false);

        AuditAssessmentReadinessSummaryRecord summary = AuditReadinessBuilder.BuildAssessmentSummary(
            [control],
            aggregateLabel);

        aggregateLabel.Should().NotBe(AuditReadinessLabels.ComplianceScoreLabel);
        aggregateLabel.Should().Be(AuditReadinessLabels.DefaultAggregateLabel);
        summary.AggregateLabel.ToLowerInvariant().Should().NotContain("compliance score");
    }

    [Fact]
    public void BuildAssessmentSummary_uses_compliance_score_label_only_when_catalog_allows()
    {
        AuditControlReadinessRecord control = new()
        {
            ControlId = Guid.NewGuid(),
            ControlNumber = "AC-1",
            Applicability = AuditControlApplicabilityStatus.Applicable,
        };

        string aggregateLabel = AuditReadinessLabels.ResolveAggregateLabel(catalogAllowsComplianceScoreAggregate: true);

        AuditAssessmentReadinessSummaryRecord summary = AuditReadinessBuilder.BuildAssessmentSummary(
            [control],
            aggregateLabel);

        aggregateLabel.Should().Be(AuditReadinessLabels.ComplianceScoreLabel);
        summary.AggregateLabel.Should().Be("Compliance score");
    }
}
