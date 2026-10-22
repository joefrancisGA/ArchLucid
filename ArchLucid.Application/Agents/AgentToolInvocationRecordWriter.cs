using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Agents;

/// <summary>Persists structured tool-invocation rows when agent traces are recorded (TB-110).</summary>
public sealed class AgentToolInvocationRecordWriter(
    IAgentToolInvocationRecordRepository repository,
    IScopeContextProvider scopeContextProvider) : IAgentToolInvocationRecordWriter
{
    private readonly IAgentToolInvocationRecordRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task SaveFromTraceAsync(
        AgentExecutionTrace trace,
        int sortOrder,
        int? durationMs,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(trace);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return;

        if (!Guid.TryParse(trace.RunId, out Guid runId) || runId == Guid.Empty)
            return;

        AgentToolInvocationRecord record = AgentToolInvocationRecordProjector.Project(
            scope.TenantId,
            runId,
            trace,
            sortOrder,
            durationMs);

        await _repository.ReplaceForTraceAsync(record, cancellationToken);
    }
}
