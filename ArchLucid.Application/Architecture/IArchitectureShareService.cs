using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureShareService
{
    Task<ArchitectureShareListResponse?> TryListSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        string actorOid,
        CancellationToken cancellationToken = default);

    Task<ArchitectureShareMutationResult> PutShareAsync(
        ScopeContext scope,
        Guid architectureId,
        PutArchitectureShareRequest request,
        string actorDisplayName,
        string actorOid,
        CancellationToken cancellationToken = default);

    Task<ArchitectureShareMutationResult> RevokeShareAsync(
        ScopeContext scope,
        Guid architectureId,
        string targetActorOid,
        string actorDisplayName,
        string actorOid,
        CancellationToken cancellationToken = default);

    Task<ArchitectureShareMutationResult> PatchRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        PatchArchitectureRestrictToSharesRequest request,
        string actorDisplayName,
        string actorOid,
        CancellationToken cancellationToken = default);
}
