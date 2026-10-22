using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class DefenderAuditEvidenceSelector : IAuditEvidenceSelector
{
    public AuditEvidenceSelectorDescriptorRecord Descriptor { get; } = new()
    {
        CollectorId = "defender-snapshot-selector",
        Version = "1.0.0",
        EvidenceTypesProduced = [AuditEvidenceTypeNames.Defender],
        RequiredAzurePermissions = ["Microsoft.Security/assessments/read", "Microsoft.Security/secureScores/read"],
        SupportedResourceTypes = ["Microsoft.Security/*"],
        CollectionMethod = "AzureInventorySnapshot.DefenderAssessments",
        ExpectedCost = "low",
        ExpectedDuration = "snapshot-bound",
        FreshnessCharacteristics = "CapturedUtc on snapshot header",
    };

    public AuditEvidenceRequirementSelectionRecord Select(
        AzureInventorySnapshotDetailReadModel snapshot,
        AuditEvidenceRequirementRecord requirement)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(requirement);

        List<AuditEvidenceCandidateRecord> candidates = [];

        foreach (AzureInventoryDefenderAssessmentReadModel assessment in snapshot.DefenderAssessments)
        {
            if (!string.Equals(assessment.Status, "Unhealthy", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(assessment.ResourceId))
            {
                continue;
            }

            string resourceId = ArmResourceIdNormalizer.Normalize(assessment.ResourceId);
            AzureInventoryResourceRecord? resource = snapshot.Resources.FirstOrDefault(candidate =>
                ArmResourceIdNormalizer.Normalize(candidate.AzureResourceId)
                    .Equals(resourceId, StringComparison.OrdinalIgnoreCase));

            candidates.Add(new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                CloudResourceId = resource?.CloudResourceId,
                AzureResourceId = resourceId,
                EvidenceType = AuditEvidenceTypeNames.Defender,
                Summary = $"{assessment.Severity} {assessment.DisplayName}".Trim(),
                ProvenanceKind = ProvenanceKind.ObservedFact,
            });
        }

        if (candidates.Count == 0 && snapshot.DefenderSummaries.Count > 0)
        {
            AzureInventoryDefenderSummaryReadModel summary = snapshot.DefenderSummaries[0];
            candidates.Add(new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                AzureResourceId = ArmResourceIdNormalizer.Normalize(summary.ResourceId),
                EvidenceType = AuditEvidenceTypeNames.Defender,
                Summary = $"Defender secure score {summary.SecureScore}",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            });
        }

        if (candidates.Count == 0 && snapshot.DefenderScoreControls.Count > 0)
        {
            AzureInventoryDefenderScoreControlReadModel control = snapshot.DefenderScoreControls[0];
            candidates.Add(new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                AzureResourceId = $"/subscriptions/{control.SubscriptionId}",
                EvidenceType = AuditEvidenceTypeNames.Defender,
                Summary = $"Defender score control {control.ControlName}",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            });
        }

        if (candidates.Count == 0)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "Defender for Cloud evidence was not in this snapshot.");
        }

        return AuditEvidenceSelectorSupport.Collected(requirement, candidates);
    }
}
