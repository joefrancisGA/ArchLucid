using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AuditControlEvaluationBuilderTests
{
    [Fact]
    public void Build_zero_evidence_returns_insufficient_and_not_supported()
    {
        Guid controlId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();

        AuditEvidenceRequirementSelectionRecord selection = new()
        {
            Requirement = new AuditEvidenceRequirementRecord
            {
                RequirementId = requirementId,
                EvidenceType = AuditEvidenceTypeNames.Logging,
                Name = "Diagnostics",
            },
            CollectionStatus = AuditEvidenceCollectionStatus.Insufficient,
            Gaps =
            [
                new AuditEvidenceGapRecord
                {
                    RequirementId = requirementId,
                    CollectionStatus = AuditEvidenceCollectionStatus.Insufficient,
                    Reason = "missing diagnostics",
                },
            ],
        };

        AuditControlEvaluationBuildResult result = AuditControlEvaluationBuilder.Build(
            controlId,
            frameworkId,
            snapshotId,
            tenantId,
            [selection],
            [],
            [],
            DateTime.UtcNow);

        result.Evaluation.Outcome.Should().Be(AuditEvaluationOutcome.InsufficientEvidence);
        result.Evaluation.EvaluationText.Should().Be(AuditControlEvaluationBuilder.InsufficientEvidenceLabel);
        result.Evaluation.PassCount.Should().Be(0);
        result.Evaluation.HumanDisposition.Should().BeNull();
    }

    [Fact]
    public void Build_failing_resource_with_approved_exception_mentions_exception_in_text()
    {
        Guid controlId = Guid.NewGuid();
        Guid frameworkId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid requirementId = Guid.NewGuid();
        string failingResource = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        AuditEvidenceRequirementSelectionRecord selection = new()
        {
            Requirement = new AuditEvidenceRequirementRecord
            {
                RequirementId = requirementId,
                EvidenceType = AuditEvidenceTypeNames.Inventory,
                Name = "Inventory",
            },
            CollectionStatus = AuditEvidenceCollectionStatus.Collected,
            Candidates =
            [
                new AuditEvidenceCandidateRecord
                {
                    RequirementId = requirementId,
                    AzureResourceId = failingResource,
                    EvidenceType = AuditEvidenceTypeNames.Inventory,
                    Summary = "resource",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AuditEvidenceCandidateRecord
                {
                    RequirementId = requirementId,
                    AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa2",
                    EvidenceType = AuditEvidenceTypeNames.Inventory,
                    Summary = "resource2",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
        };

        AuditControlEvaluationBuildResult result = AuditControlEvaluationBuilder.Build(
            controlId,
            frameworkId,
            snapshotId,
            tenantId,
            [selection],
            ["EX-174"],
            [failingResource],
            DateTime.UtcNow);

        result.Evaluation.Outcome.Should().Be(AuditEvaluationOutcome.TechnicallySupported);
        result.Evaluation.EvaluationText.Should().Contain("Exception EX-174");
        result.Evaluation.EvaluationText.Should().Contain(failingResource);
        result.Evaluation.HumanDisposition.Should().BeNull();
    }

    [Fact]
    public void Build_never_sets_human_disposition_from_builder()
    {
        Guid requirementId = Guid.NewGuid();

        AuditEvidenceRequirementSelectionRecord selection = new()
        {
            Requirement = new AuditEvidenceRequirementRecord
            {
                RequirementId = requirementId,
                EvidenceType = AuditEvidenceTypeNames.Inventory,
                Name = "Inventory",
            },
            CollectionStatus = AuditEvidenceCollectionStatus.Collected,
            Candidates =
            [
                new AuditEvidenceCandidateRecord
                {
                    RequirementId = requirementId,
                    AzureResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                    EvidenceType = AuditEvidenceTypeNames.Inventory,
                    Summary = "resource",
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
        };

        AuditControlEvaluationBuildResult result = AuditControlEvaluationBuilder.Build(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            [selection],
            [],
            [],
            DateTime.UtcNow);

        result.Evaluation.HumanDisposition.Should().BeNull();
        result.Evaluation.Notes.Should().BeNull();
        result.Evaluation.ProvenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
    }
}
