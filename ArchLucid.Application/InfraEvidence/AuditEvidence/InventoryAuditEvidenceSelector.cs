using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class InventoryAuditEvidenceSelector : IAuditEvidenceSelector
{
    public AuditEvidenceSelectorDescriptorRecord Descriptor { get; } = new()
    {
        CollectorId = "inventory-snapshot-selector",
        Version = "1.0.0",
        EvidenceTypesProduced = [AuditEvidenceTypeNames.Inventory],
        RequiredAzurePermissions = ["Microsoft.Resources/subscriptions/resources/read"],
        SupportedResourceTypes = ["*"],
        CollectionMethod = "AzureInventorySnapshot.Resources",
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

        if (snapshot.Resources.Count == 0)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "Inventory snapshot contains no resources.");
        }

        List<AuditEvidenceCandidateRecord> candidates = snapshot.Resources
            .Where(resource => AuditEvidenceSelectorSupport.MatchesRequiredResourceType(resource, requirement.RequiredResourceTypes))
            .Select(resource => new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                CloudResourceId = resource.CloudResourceId,
                AzureResourceId = resource.AzureResourceId,
                EvidenceType = requirement.EvidenceType,
                Summary = $"Resource {resource.AzureResourceId} ({resource.ResourceType})",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            })
            .ToList();

        if (candidates.Count == 0)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "No resources matched the required resource types.");
        }

        return AuditEvidenceSelectorSupport.Collected(requirement, candidates);
    }
}
