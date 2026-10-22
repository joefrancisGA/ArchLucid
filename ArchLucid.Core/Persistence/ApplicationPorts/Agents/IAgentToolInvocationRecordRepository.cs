using ArchLucid.Contracts.Agents;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Agents;

/// <summary>Structured tool-invocation ledger per run (TB-110).</summary>
public interface IAgentToolInvocationRecordRepository
{
    Task ReplaceForTraceAsync(AgentToolInvocationRecord record, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AgentToolInvocationRecord>> ListByRunAsync(
        Guid tenantId,
        Guid runId,
        CancellationToken cancellationToken = default);
}
