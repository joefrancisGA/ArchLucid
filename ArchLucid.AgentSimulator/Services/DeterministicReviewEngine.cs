using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.AgentSimulator.Services;

/// <summary>
///     Deterministic <see cref="IAgentExecutor" /> for tests and simulator mode — stable structured output without live
///     model calls. This class is not the review evaluation kernel; that kernel is
///     <c>AuthorityPipelineStagesExecutor</c>.
/// </summary>
public sealed class DeterministicReviewEngine : IAgentExecutor
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
