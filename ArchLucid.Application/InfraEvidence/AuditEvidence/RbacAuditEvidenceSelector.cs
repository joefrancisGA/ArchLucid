using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class RbacAuditEvidenceSelector : IAuditEvidenceSelector
{
    public AuditEvidenceSelectorDescriptorRecord Descriptor { get; } = new()
    {
        CollectorId = "rbac-snapshot-selector",
        Version = "1.0.0",
        EvidenceTypesProduced = [AuditEvidenceTypeNames.Rbac],
        RequiredAzurePermissions = ["Microsoft.Authorization/roleAssignments/read"],
        SupportedResourceTypes = ["Microsoft.Authorization/roleAssignments"],
        CollectionMethod = "AzureInventorySnapshot.RoleAssignments",
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

        if (snapshot.RoleAssignments.Count == 0)
        {
            return AuditEvidenceSelectorSupport.Insufficient(
                requirement,
                "Inventory snapshot does not contain role assignment rows.");
        }

        List<AuditEvidenceCandidateRecord> candidates = snapshot.RoleAssignments
            .Select(assignment => new AuditEvidenceCandidateRecord
            {
                RequirementId = requirement.RequirementId,
                AzureResourceId = assignment.Scope,
                EvidenceType = requirement.EvidenceType,
                Summary = $"Role assignment {assignment.RoleDefinitionId} on {assignment.Scope}",
                ProvenanceKind = ProvenanceKind.ObservedFact,
            })
            .ToList();

        return AuditEvidenceSelectorSupport.Collected(requirement, candidates);
    }
}
