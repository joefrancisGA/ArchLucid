namespace ArchLucid.Persistence.InfraEvidence;

using ArchLucid.Core.InfraEvidence;

public interface IAuditEvidenceSelector
{
    AuditEvidenceSelectorDescriptorRecord Descriptor
    {
        get;
    }

    AuditEvidenceRequirementSelectionRecord Select(
        AzureInventorySnapshotDetailReadModel snapshot,
        AuditEvidenceRequirementRecord requirement);
}
