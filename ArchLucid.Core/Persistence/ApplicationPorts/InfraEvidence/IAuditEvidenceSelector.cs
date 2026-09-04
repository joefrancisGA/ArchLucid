namespace ArchLucid.Persistence.InfraEvidence;

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
