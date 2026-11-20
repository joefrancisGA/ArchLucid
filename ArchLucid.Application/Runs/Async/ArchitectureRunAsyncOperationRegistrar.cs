using System.Collections.Concurrent;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Async;

public sealed class ArchitectureRunAsyncOperationRegistrar : IArchitectureRunAsyncOperationRegistrar
{
    private readonly ConcurrentDictionary<string, TaskCompletionSource> _inFlight = new(StringComparer.Ordinal);

    public bool TryRegister(ScopeContext scope, string runId, ArchitectureRunAsyncOperationKind kind)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return _inFlight.TryAdd(
            BuildKey(scope, runId, kind),
            new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously));
    }

    public bool IsRegistered(ScopeContext scope, string runId, ArchitectureRunAsyncOperationKind kind)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return _inFlight.ContainsKey(BuildKey(scope, runId, kind));
    }

    public void Release(ScopeContext scope, string runId, ArchitectureRunAsyncOperationKind kind)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (_inFlight.TryRemove(BuildKey(scope, runId, kind), out TaskCompletionSource? completion))
            completion.TrySetResult();
    }

    public Task? GetReleaseTask(ScopeContext scope, string runId, ArchitectureRunAsyncOperationKind kind)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return _inFlight.TryGetValue(BuildKey(scope, runId, kind), out TaskCompletionSource? completion)
            ? completion.Task
            : null;
    }

    private static string BuildKey(ScopeContext scope, string runId, ArchitectureRunAsyncOperationKind kind) =>
        $"{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{kind}:{NormalizeRunId(runId)}";

    private static string NormalizeRunId(string runId)
    {
        if (Guid.TryParse(runId, out Guid parsed))
            return parsed.ToString("N");

        return runId;
    }
}
