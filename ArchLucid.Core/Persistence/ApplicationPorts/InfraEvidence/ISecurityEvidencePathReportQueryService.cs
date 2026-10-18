using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidencePathReportQueryService
{
    Task<SecurityEvidencePathReportResponse?> TryGetReportAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);
}
