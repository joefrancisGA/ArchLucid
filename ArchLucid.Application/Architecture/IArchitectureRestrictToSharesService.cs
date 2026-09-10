using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureRestrictToSharesService
{
    Task<ArchitectureRestrictToSharesSetResult> SetAsync(
        ScopeContext scope,
        Guid architectureId,
        bool restrictToShares,
        bool confirmOptIn,
        Guid actorUserId,
        string grantedBy,
        CancellationToken cancellationToken = default);
}
