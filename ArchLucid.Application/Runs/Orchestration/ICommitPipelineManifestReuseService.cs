using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Reuses the pipeline golden manifest at commit when findings and rule audit are unchanged (TB-575).
/// </summary>
public interface ICommitPipelineManifestReuseService
{
    /// <summary>
    ///     Returns a pipeline manifest and trace when commit can skip full <see cref="IDecisionEngine.DecideAsync" />.
    /// </summary>
    Task<CommitPipelineManifestReuseResult?> TryReusePipelineManifestAsync(
        ArchitectureRun run,
        Guid runGuid,
        Guid contextSnapshotId,
        GraphSnapshot graph,
        GraphSnapshot graphForDecision,
        FindingsSnapshot findings,
        ScopeContext scope,
        CancellationToken cancellationToken);
}

/// <summary>Manifest and trace prepared for authority commit without a full decision-engine rebuild.</summary>
public sealed record CommitPipelineManifestReuseResult(ManifestDocument Manifest, DecisionTraceDto TraceDto);
