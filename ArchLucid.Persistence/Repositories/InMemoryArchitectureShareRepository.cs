using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

public sealed class InMemoryArchitectureShareRepository : IArchitectureShareRepository
{
    private readonly Dictionary<(Guid ArchitectureId, string ActorOid), ArchitectureShareRecord> _byKey = new();

    public Task<IReadOnlyList<ArchitectureShareRecord>> ListByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = cancellationToken;

        List<ArchitectureShareRecord> shares = _byKey.Values
            .Where(record => record.ArchitectureId == architectureId)
            .OrderBy(record => record.ActorOid, StringComparer.Ordinal)
            .Select(Clone)
            .ToList();

        return Task.FromResult<IReadOnlyList<ArchitectureShareRecord>>(shares);
    }

    public Task<ArchitectureShareRecord?> TryGetAsync(
        ScopeContext scope,
        Guid architectureId,
        string actorOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorOid);
        _ = cancellationToken;

        if (!_byKey.TryGetValue((architectureId, actorOid.Trim()), out ArchitectureShareRecord? record))
            return Task.FromResult<ArchitectureShareRecord?>(null);

        return Task.FromResult<ArchitectureShareRecord?>(Clone(record));
    }

    public Task UpsertAsync(
        ScopeContext scope,
        ArchitectureShareRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(record);
        _ = cancellationToken;

        _byKey[(record.ArchitectureId, record.ActorOid.Trim())] = Clone(record);

        return Task.CompletedTask;
    }

    public Task<bool> TryDeleteAsync(
        ScopeContext scope,
        Guid architectureId,
        string actorOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorOid);
        _ = cancellationToken;

        return Task.FromResult(_byKey.Remove((architectureId, actorOid.Trim())));
    }

    public Task<int> CountByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = cancellationToken;

        int count = _byKey.Values.Count(record => record.ArchitectureId == architectureId);

        return Task.FromResult(count);
    }

    private static ArchitectureShareRecord Clone(ArchitectureShareRecord record) =>
        new()
        {
            ArchitectureId = record.ArchitectureId,
            ActorOid = record.ActorOid,
            Role = record.Role,
            GrantedBy = record.GrantedBy,
            GrantedUtc = record.GrantedUtc,
            RowVersion = record.RowVersion,
        };
}
