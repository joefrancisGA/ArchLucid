using System.Diagnostics;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;

using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Mutable state passed through ordered authority pipeline stage handlers inside one unit of work.
/// </summary>
public sealed class AuthorityPipelineContext
{
    public required RunRecord Run
    {
        get;
        init;
    }

    public required ContextIngestionRequest Request
    {
        get;
        set;
    }

    private IArchLucidUnitOfWork _initialUnitOfWork = null!;

    public required IArchLucidUnitOfWork UnitOfWork
    {
        get => RecoveryUnitOfWork ?? _initialUnitOfWork;
        init => _initialUnitOfWork = value;
    }

    internal IArchLucidUnitOfWork? RecoveryUnitOfWork { get; set; }

    internal bool RebuildGraphForDependencyChange { get; set; }

    internal bool UsesDurableRecovery { get; init; }

    public required ScopeContext Scope
    {
        get;
        init;
    }

    public Activity? RunActivity
    {
        get;
        init;
    }

    internal AnalysisExecutionBudget? ExecutionBudget { get; init; }

    internal List<StageTimelineSummary> TerminalStageTimeline { get; } = [];

    public ContextSnapshot? PriorCommittedContext
    {
        get;
        set;
    }

    public ContextSnapshot? ContextSnapshot
    {
        get;
        set;
    }

    public GraphSnapshotResolutionResult? GraphResolution
    {
        get;
        set;
    }

    public GraphSnapshot? GraphSnapshot
    {
        get;
        set;
    }

    public FindingsSnapshot? FindingsSnapshot
    {
        get;
        set;
    }

    public ManifestDocument? Manifest
    {
        get;
        set;
    }

    public DecisionTraceDto? Trace
    {
        get;
        set;
    }

    public ArtifactBundle? ArtifactBundle
    {
        get;
        set;
    }
}

