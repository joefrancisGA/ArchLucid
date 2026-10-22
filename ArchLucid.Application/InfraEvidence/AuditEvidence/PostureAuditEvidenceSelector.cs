using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class PostureAuditEvidenceSelector : IAuditEvidenceSelector
{
    public AuditEvidenceSelectorDescriptorRecord Descriptor { get; } = new()
    {
        CollectorId = "posture-snapshot-selector",
        Version = "1.0.0",
        EvidenceTypesProduced = [AuditEvidenceTypeNames.Posture],
        RequiredAzurePermissions = ["Microsoft.Security/*/read"],
        SupportedResourceTypes = ["Microsoft.Security/*"],
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
                property.PropertyKey.Contains("secure", StringComparison.OrdinalIgnoreCase)
                || property.PropertyKey.Contains("tls", StringComparison.OrdinalIgnoreCase)
                || property.PropertyKey.Contains("https", StringComparison.OrdinalIgnoreCase))
            .Select(property => new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                EvidenceType = requirement.EvidenceType,
                Summary = $"Posture property {property.PropertyKey}",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            })
            .ToList();

        if (candidates.Count == 0)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "Inventory snapshot lacks posture-related properties.");
        }

        return AuditEvidenceSelectorSupport.Collected(requirement, candidates);
    }
}
