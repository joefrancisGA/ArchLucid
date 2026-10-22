using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

public interface IArchitectureWorkLeaseHolderResolver
{
    Task<Guid?> TryResolveHolderUserIdAsync(
        ScopeContext scope,
        string actorId,
        CancellationToken cancellationToken = default);
}
