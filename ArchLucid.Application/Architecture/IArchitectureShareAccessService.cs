using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureShareAccessService
{
    Task<ArchitectureShareAccessEvaluation> EvaluateAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid? actorUserId,
        bool hasReadAuthority,
        bool hasExecuteAuthority,
        bool hasWorkspaceAdminAuthority,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Restricted architectures in scope the actor cannot view without a share row (workspace admins: 0).
    /// </summary>
    Task<int> CountRestrictedWithoutActorShareAsync(
        ScopeContext scope,
        Guid? actorUserId,
        bool hasWorkspaceAdminAuthority,
        CancellationToken cancellationToken = default);
}
