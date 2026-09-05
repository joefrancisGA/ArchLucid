using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class IdentityAuditEvidenceSelector : IAuditEvidenceSelector
{
    public AuditEvidenceSelectorDescriptorRecord Descriptor { get; } = new()
    {
        CollectorId = "identity-snapshot-selector",
        Version = "1.0.0",
        EvidenceTypesProduced = [AuditEvidenceTypeNames.Identity],
        RequiredAzurePermissions = ["Microsoft.Authorization/roleAssignments/read"],
        SupportedResourceTypes = ["Microsoft.ManagedIdentity/userAssignedIdentities"],
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

        if (AuditEvidenceTypeNames.EntraSpecificTypes.Contains(requirement.EvidenceType))
        {
            return AuditEvidenceSelectorSupport.Unsupported(
                requirement,
                "Entra, PIM, Conditional Access, and Defender evidence are not present in inventory snapshots.");
        }

        List<AzureInventoryResourceRecord> identityResources = snapshot.Resources
            .Where(resource =>
                resource.ResourceType.Contains("ManagedIdentity", StringComparison.OrdinalIgnoreCase)
                || resource.ResourceType.Contains("identity", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (identityResources.Count == 0)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "Inventory snapshot does not contain identity resources.");
        }

        List<AuditEvidenceCandidateRecord> candidates = identityResources
            .Select(resource => new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                CloudResourceId = resource.CloudResourceId,
                AzureResourceId = resource.AzureResourceId,
                EvidenceType = requirement.EvidenceType,
                Summary = $"Identity resource {resource.AzureResourceId}",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            })
            .ToList();

        return AuditEvidenceSelectorSupport.Collected(requirement, candidates);
    }
}
