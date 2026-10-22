namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditEvidenceSelectorRegistry
{
    IReadOnlyList<AuditEvidenceSelectorDescriptorRecord> ListDescriptors();

    bool TryGetSelector(string evidenceType, out IAuditEvidenceSelector? selector);
}
