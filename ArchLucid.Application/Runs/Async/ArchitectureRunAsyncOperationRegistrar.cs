using System.Collections.Concurrent;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Async;

public sealed class ArchitectureRunAsyncOperationRegistrar : IArchitectureRunAsyncOperationRegistrar
{
    private readonly ConcurrentDictionary<string, byte> _inFlight = new(StringComparer.Ordinal);

    public bool TryRegister(ScopeContext scope, string runId, ArchitectureRunAsyncOperationKind kind)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return _inFlight.TryAdd(BuildKey(scope, runId, kind), 0);
    }

    public void Release(ScopeContext scope, string runId, ArchitectureRunAsyncOperationKind kind)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        _inFlight.TryRemove(BuildKey(scope, runId, kind), out _);
    }

    private static string BuildKey(ScopeContext scope, string runId, ArchitectureRunAsyncOperationKind kind) =>
        $"{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{kind}:{runId}";
}
