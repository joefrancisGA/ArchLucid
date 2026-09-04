using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class ResilienceAuditEvidenceSelector : IAuditEvidenceSelector
{
    public AuditEvidenceSelectorDescriptorRecord Descriptor { get; } = new()
    {
        CollectorId = "resilience-snapshot-selector",
        Version = "1.0.0",
        EvidenceTypesProduced = [AuditEvidenceTypeNames.Resilience],
        RequiredAzurePermissions = ["Microsoft.Compute/*/read", "Microsoft.Sql/servers/read"],
        SupportedResourceTypes =
        [
            "Microsoft.Compute/virtualMachines",
            "Microsoft.Sql/servers",
            "Microsoft.RecoveryServices/vaults",
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

        List<AuditEvidenceCandidateRecord> candidates = snapshot.Properties
            .Where(property =>
                property.PropertyKey.Contains("zone", StringComparison.OrdinalIgnoreCase)
                || property.PropertyKey.Contains("redundan", StringComparison.OrdinalIgnoreCase)
                || property.PropertyKey.Contains("backup", StringComparison.OrdinalIgnoreCase))
            .Select(property => new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                EvidenceType = requirement.EvidenceType,
                Summary = $"Resilience property {property.PropertyKey}",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            })
            .ToList();

        if (candidates.Count == 0)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "Inventory snapshot lacks resilience-related properties.");
        }

        return AuditEvidenceSelectorSupport.Collected(requirement, candidates);
    }
}
