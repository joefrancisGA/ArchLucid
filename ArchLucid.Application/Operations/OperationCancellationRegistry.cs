using System.Collections.Concurrent;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Operations;

public sealed class OperationCancellationRegistry : IOperationCancellationRegistry
{
    private readonly ConcurrentDictionary<string, byte> _cancelRequested = new(StringComparer.Ordinal);

    public bool TryRequestCancel(ScopeContext scope, string operationId)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(operationId);

        return _cancelRequested.TryAdd(BuildKey(scope, operationId), 0);
    }

    public bool IsCancelRequested(ScopeContext scope, string operationId)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(operationId);

        return _cancelRequested.ContainsKey(BuildKey(scope, operationId));
    }

    public bool IsCancelRequestedAnyScope(string operationId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(operationId);

        string suffix = $":{operationId}";

        foreach (string key in _cancelRequested.Keys)
        {
            if (key.EndsWith(suffix, StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    public void ClearCancelRequest(ScopeContext scope, string operationId)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(operationId);

        _cancelRequested.TryRemove(BuildKey(scope, operationId), out _);
    }

    private static string BuildKey(ScopeContext scope, string operationId) =>
        $"{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{operationId}";
}
