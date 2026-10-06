using System.Collections.Concurrent;

namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <summary>
/// Process-wide admission set for execute leases on this host.
/// The lease service is scoped, so each request would otherwise keep a private dictionary
/// and two concurrent executes could both renew the same SQL holder.
/// </summary>
public sealed class RunExecuteOwnershipActiveHolderRegistry
{
    private readonly ConcurrentDictionary<Guid, string> _holders = new();

    public bool Contains(Guid runId) => _holders.ContainsKey(runId);

    public bool TryAdmit(Guid runId, string holderInstanceId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(holderInstanceId);

        return _holders.TryAdd(runId, holderInstanceId);
    }

    public bool TryGetHolder(Guid runId, out string? holderInstanceId) =>
        _holders.TryGetValue(runId, out holderInstanceId);

    public bool TryRemove(Guid runId) => _holders.TryRemove(runId, out _);

    public IReadOnlyCollection<string> HolderInstanceIds => _holders.Values.ToArray();

    public void Clear() => _holders.Clear();
}
