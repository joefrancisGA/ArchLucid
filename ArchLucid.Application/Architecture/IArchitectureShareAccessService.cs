using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureShareAccessService
{
    Task<ArchitectureShareAccessEvaluation> EvaluateAsync(
        ScopeContext scope,
        Guid architectureId,
        string? actorOid,
        bool hasReadAuthority,
        bool hasExecuteAuthority,
        bool hasWorkspaceAdminAuthority,
        CancellationToken cancellationToken = default);
}
