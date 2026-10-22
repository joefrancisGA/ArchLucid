using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class GovernanceAuditEvidenceSelector : IAuditEvidenceSelector
{
    public AuditEvidenceSelectorDescriptorRecord Descriptor { get; } = new()
    {
        CollectorId = "governance-snapshot-selector",
        Version = "1.0.0",
        EvidenceTypesProduced = [AuditEvidenceTypeNames.Governance],
        RequiredAzurePermissions = ["Microsoft.Resources/tags/read", "Microsoft.PolicyInsights/*/read"],
        SupportedResourceTypes = ["*"],
        CollectionMethod = "AzureInventorySnapshot.Tags",
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

        if (snapshot.Tags.Count == 0)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "Inventory snapshot does not contain resource tags for governance evidence.");
        }

        List<AuditEvidenceCandidateRecord> candidates = snapshot.Tags
            .GroupBy(tag => tag.ResourceRowId)
            .Select(group => new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                EvidenceType = requirement.EvidenceType,
                Summary = $"Tagged resource row {group.Key} ({group.Count()} tags)",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            })
            .ToList();

        return AuditEvidenceSelectorSupport.Collected(requirement, candidates);
    }
}
