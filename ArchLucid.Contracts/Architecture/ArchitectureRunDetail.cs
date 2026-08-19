using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Canonical aggregate for a single architecture run: the authoritative source for
///     export, compare, governance, and explanation features. Assembled by
///     <c>IRunDetailQueryService</c> — do not rebuild this by hand in controllers.
/// </summary>
public sealed class ArchitectureRunDetail
{
    /// <summary>Core run record including status, timestamps, and version references.</summary>
    public ArchitectureRun Run
    {
        get;
        set;
    } = new();

    /// <summary>Agent tasks created for this run.</summary>
    public List<AgentTask> Tasks
    {
        get;
        set;
    } = [];

    /// <summary>Agent results produced during execution.</summary>
    public List<AgentResult> Results
    {
        get;
        set;
    } = [];

    /// <summary>
    ///     Golden manifest produced during commit, or <see langword="null" /> when the run
    ///     has not yet been committed or the manifest could not be loaded.
    /// </summary>
    public GoldenManifest? Manifest
    {
        get;
        set;
    }

    /// <summary>Decision traces recorded during commit; empty before commit.</summary>
    public List<DecisionTraceDto> DecisionTraces
    {
        get;
        set;
    } = [];

    /// <summary>Summed LLM token usage and USD estimate from persisted execution traces (TB-106).</summary>
    public ArchLucid.Contracts.Runs.RunAgentLlmCostEstimateDto? AgentExecutionLlmCostEstimate
    {
        get;
        set;
    }

    /// <summary>Convenience accessor: <see langword="true" /> when the run has a committed manifest.</summary>
    public bool IsCommitted => Manifest is not null;

    /// <summary>
    ///     <see langword="true" /> when the run's <c>CurrentManifestVersion</c> is set but the
    ///     corresponding <see cref="GoldenManifest" /> row could not be loaded from storage.
    ///     Indicates a broken storage reference (e.g. the manifest was deleted or there is
    ///     replication lag). Callers should treat this as a 409 Conflict / inconsistent state
    ///     rather than a normal "not yet committed" case.
    /// </summary>
    public bool HasBrokenManifestReference
    {
        get;
        set;
    }

    /// <summary>
    ///     Authority pipeline complete: every authority stage in
    ///     <c>context_ingestion</c>, <c>graph</c>, <c>findings</c>, <c>decisioning</c>, <c>artifacts</c>
    ///     succeeded in <c>RunStageOutcomes</c>, and a golden manifest pointer is present
    ///     (<c>GoldenManifestId</c> or <see cref="Manifest" /> not null — the same GET
    ///     <c>/v1/architecture/review/{runId}</c> rules). Independent of
    ///     <see cref="AgentTaskLoopComplete" />.
    /// </summary>
    public bool AuthorityPipelineComplete
    {
        get;
        set;
    }

    /// <summary>
    ///     Agent-task loop complete: run status is <c>ReadyForCommit</c> and
    ///     <c>HasCommitReadyAgentResults</c> is true for Topology, Cost, Compliance, and Critic.
    ///     Independent of <see cref="AuthorityPipelineComplete" />.
    /// </summary>
    public bool AgentTaskLoopComplete
    {
        get;
        set;
    }
}
