using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class DataAuditEvidenceSelector : IAuditEvidenceSelector
{
    public AuditEvidenceSelectorDescriptorRecord Descriptor { get; } = new()
    {
        CollectorId = "data-snapshot-selector",
        Version = "1.0.0",
        EvidenceTypesProduced = [AuditEvidenceTypeNames.Data],
        RequiredAzurePermissions = ["Microsoft.Storage/storageAccounts/read", "Microsoft.Sql/servers/read"],
        SupportedResourceTypes =
        [
            "Microsoft.Storage/storageAccounts",
            "Microsoft.Sql/servers",
            "Microsoft.DocumentDB/databaseAccounts",
        ],
        CollectionMethod = "AzureInventorySnapshot.Resources+Properties",
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

        HashSet<Guid> dataResourceRowIds = snapshot.Resources
            .Where(resource =>
                resource.ResourceType.Contains("Storage", StringComparison.OrdinalIgnoreCase)
                || resource.ResourceType.Contains("Sql", StringComparison.OrdinalIgnoreCase)
                || resource.ResourceType.Contains("DocumentDB", StringComparison.OrdinalIgnoreCase))
            .Select(resource => resource.ResourceRowId)
            .ToHashSet();

        if (dataResourceRowIds.Count == 0)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "Inventory snapshot does not contain data-plane resources.");
        }

        bool hasEncryptionProperty = snapshot.Properties.Any(property =>
            dataResourceRowIds.Contains(property.ResourceRowId)
            && property.PropertyKey.Contains("encrypt", StringComparison.OrdinalIgnoreCase));

        if (!hasEncryptionProperty)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "Inventory snapshot lacks encryption-related properties for data resources.");
        }

        List<AuditEvidenceCandidateRecord> candidates = snapshot.Resources
            .Where(resource => dataResourceRowIds.Contains(resource.ResourceRowId))
            .Select(resource => new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                CloudResourceId = resource.CloudResourceId,
                AzureResourceId = resource.AzureResourceId,
                EvidenceType = requirement.EvidenceType,
                Summary = $"Data resource {resource.AzureResourceId}",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            })
            .ToList();

        return AuditEvidenceSelectorSupport.Collected(requirement, candidates);
    }
}
