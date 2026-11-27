using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence;

public interface IPublicIpAssessmentQueryService
{
    Task<PublicIpAssessmentResponse?> TryGetAsync(
        ScopeContext scope, Guid snapshotId, int page, int pageSize, CancellationToken cancellationToken = default);
}
