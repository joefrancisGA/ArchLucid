using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

public sealed class RemediationPathVerificationContext
{
    public byte[] SourcePathCanonicalHash
    {
        get;
        init;
    } = [];

    public IReadOnlyList<SecurityEvidencePathRecord> VerificationSnapshotPaths
    {
        get;
        init;
    } = [];
}
