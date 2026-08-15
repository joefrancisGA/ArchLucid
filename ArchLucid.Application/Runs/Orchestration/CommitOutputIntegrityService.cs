using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref="ICommitOutputIntegrityService" />
public sealed class CommitOutputIntegrityService(
    IScopeContextProvider scopeContextProvider,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IAgentOutputQualityGateOptionsResolver qualityGateOptionsResolver) : ICommitOutputIntegrityService
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IAgentOutputQualityGateOptionsResolver _qualityGateOptionsResolver =
        qualityGateOptionsResolver ?? throw new ArgumentNullException(nameof(qualityGateOptionsResolver));

    /// <inheritdoc />
    public async Task EnsurePassOrThrowAsync(
        ArchitectureRun run,
        string runId,
        FindingsSnapshot findings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(findings);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentExecutionTrace> traces =
            await _agentExecutionTraceRepository.GetByRunIdAsync(scope, runId, cancellationToken);

        AgentOutputQualityGateOptions gateOptions = _qualityGateOptionsResolver.Resolve(cancellationToken);
        IReadOnlyList<string> qualityReasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, gateOptions, traces);

        if (qualityReasons.Count > 0)
        {
            throw new ConflictException(
                "Commit blocked: agent output quality gate rejected one or more traces. "
                + string.Join(" ", qualityReasons));
        }

        IReadOnlyList<string> provenanceViolations = DecisionGradeFindingProvenanceValidator.GetViolations(findings);

        if (provenanceViolations.Count > 0)
        {
            throw new ConflictException(
                "Commit blocked: one or more findings lack decision-grade provenance. "
                + string.Join(" ", provenanceViolations));
        }
    }
}
