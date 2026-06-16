using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.AgentSimulator.Services;

/// <summary>
///     Deterministic <see cref="IReviewEngine" /> for tests and simulator mode — stable structured output without live
///     model calls.
/// </summary>
public sealed class DeterministicReviewEngine : IReviewEngine
{
    private readonly DeterministicAgentSimulator _inner;

    public DeterministicReviewEngine()
        : this(new DeterministicAgentSimulator())
    {
    }

    public DeterministicReviewEngine(DeterministicAgentSimulator inner)
    {
        _inner = inner ?? throw new ArgumentNullException(nameof(inner));
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AgentResult>> ExecuteAsync(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyCollection<AgentTask> tasks,
        CancellationToken cancellationToken = default)
    {
        return _inner.ExecuteAsync(runId, request, evidence, tasks, cancellationToken);
    }
}
