using System.Collections.Concurrent;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;

namespace ArchLucid.Persistence.Agents;

/// <summary>In-memory structured tool-invocation ledger (TB-110).</summary>
public sealed class InMemoryAgentToolInvocationRecordRepository : IAgentToolInvocationRecordRepository
{
    private readonly ConcurrentDictionary<string, AgentToolInvocationRecord> _byTraceKey = new();

    public Task ReplaceForTraceAsync(AgentToolInvocationRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        string key = $"{record.TenantId:N}:{record.TraceId}";

        _byTraceKey[key] = record;

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<AgentToolInvocationRecord>> ListByRunAsync(
        Guid tenantId,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        List<AgentToolInvocationRecord> rows = _byTraceKey.Values
            .Where(r => r.TenantId == tenantId && r.RunId == runId)
            .OrderBy(r => r.InvokedAtUtc)
            .ThenBy(r => r.SortOrder)
            .ThenBy(r => r.TraceId, StringComparer.Ordinal)
            .ToList();

        return Task.FromResult<IReadOnlyList<AgentToolInvocationRecord>>(rows);
    }
}
