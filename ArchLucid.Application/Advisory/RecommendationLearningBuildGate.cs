using System.Collections.Concurrent;

namespace ArchLucid.Application.Advisory;

/// <summary>Prevents concurrent rebuild/preview work for the same tenant/workspace/project scope.</summary>
public sealed class RecommendationLearningBuildGate
{
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _scopes = new(StringComparer.Ordinal);

    public async Task<IAsyncDisposable> AcquireAsync(Guid tenantId, Guid workspaceId, Guid projectId, CancellationToken ct)
    {
        string key = $"{tenantId:N}:{workspaceId:N}:{projectId:N}";
        SemaphoreSlim gate = _scopes.GetOrAdd(key, static _ => new SemaphoreSlim(1, 1));

        await gate.WaitAsync(ct).ConfigureAwait(false);

        return new Release(gate);
    }

    private sealed class Release(SemaphoreSlim gate) : IAsyncDisposable
    {
        public ValueTask DisposeAsync()
        {
            gate.Release();

            return ValueTask.CompletedTask;
        }
    }
}
