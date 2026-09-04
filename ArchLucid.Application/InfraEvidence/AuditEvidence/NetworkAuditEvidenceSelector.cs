using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class NetworkAuditEvidenceSelector : IAuditEvidenceSelector
{
    public AuditEvidenceSelectorDescriptorRecord Descriptor { get; } = new()
    {
        CollectorId = "network-snapshot-selector",
        Version = "1.0.0",
        EvidenceTypesProduced = [AuditEvidenceTypeNames.Network],
        RequiredAzurePermissions = ["Microsoft.Network/*/read"],
        SupportedResourceTypes =
        [
            "Microsoft.Network/virtualNetworks",
            "Microsoft.Network/networkSecurityGroups",
            "Microsoft.Network/publicIPAddresses",
        ],
        CollectionMethod = "AzureInventorySnapshot.Resources+Relationships",
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

        List<AzureInventoryResourceRecord> networkResources = snapshot.Resources
            .Where(resource =>
                resource.ResourceType.Contains("Microsoft.Network/", StringComparison.OrdinalIgnoreCase)
                && AuditEvidenceSelectorSupport.MatchesRequiredResourceType(resource, requirement.RequiredResourceTypes))
            .ToList();

        if (networkResources.Count == 0)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "Inventory snapshot does not contain network resources for this requirement.");
        }

        List<AuditEvidenceCandidateRecord> candidates = networkResources
            .Select(resource => new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                CloudResourceId = resource.CloudResourceId,
                AzureResourceId = resource.AzureResourceId,
                EvidenceType = requirement.EvidenceType,
                Summary = $"Network resource {resource.AzureResourceId}",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            })
            .ToList();

        return AuditEvidenceSelectorSupport.Collected(requirement, candidates);
    }
}
