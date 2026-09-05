using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditHybridControlEvidenceRecord
{
    public Guid ControlId
    {
        get;
        init;
    }

    public IReadOnlyList<AuditEvidenceSourceKind> SourceKinds
    {
        get;
        init;
    } = [];
}
