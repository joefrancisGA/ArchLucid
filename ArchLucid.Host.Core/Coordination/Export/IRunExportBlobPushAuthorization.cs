using ArchLucid.Core.Scoping;

namespace ArchLucid.Host.Core.Coordination.Export;

/// <summary>Resolves the current, revocable authorization of a blob export's server-bound requester.</summary>
public interface IRunExportBlobPushAuthorization
{
    Task<Guid?> AuthorizeAsync(
        ScopeContext scope, Guid runId, string? actorKey, Guid? expectedDirectoryUserId, CancellationToken ct);
}
