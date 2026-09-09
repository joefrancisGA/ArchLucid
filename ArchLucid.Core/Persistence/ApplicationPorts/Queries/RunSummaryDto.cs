using ArchLucid.Contracts.Common;

namespace ArchLucid.Persistence.Queries;

/// <summary>
///     Lightweight projection of a <see cref="ArchLucid.Persistence.Models.RunRecord" /> for lists and cards (ids only for
///     linked artifacts).
/// </summary>
/// <remarks>
///     Mapped by <see cref="IAuthorityQueryService" /> from runs; HTTP exposure as
///     <see cref="ArchLucid.Api.Contracts.RunSummaryResponse" /> including derived <c>Has*</c> flags.
/// </remarks>
public class RunSummaryDto
{
    /// <summary>Run primary key.</summary>
    public Guid RunId
    {
        get;
        set;
    }

    /// <summary>Authority project slug this run belongs to.</summary>
    public string ProjectId
    {
        get;
        set;
    } = null!;

    /// <summary>Optional operator description.</summary>
    public string? Description
    {
        get;
        set;
    }

    /// <summary>When the run was created (UTC).</summary>
    public DateTime CreatedUtc
    {
        get;
        set;
    }

    /// <summary>Creator identity when captured at run create; null for legacy rows.</summary>
    public string? CreatedByUserId
    {
        get;
        set;
    }

    /// <summary>When <see langword="true" />, this run is the trial welcome ecommerce sample.</summary>
    public bool IsDemoWelcomeRun
    {
        get;
        set;
    }

    /// <summary>When <see langword="true" />, this run is seeded sample data eligible for auto-purge.</summary>
    public bool IsSample
    {
        get;
        set;
    }

    /// <summary>When <see langword="true" />, the operator pinned this run in the workspace run list.</summary>
    public bool IsPinned
    {
        get;
        set;
    }

    /// <summary><see langword="true" /> when <see cref="ContextSnapshotId" /> is set.</summary>
    public bool HasContextSnapshot => ContextSnapshotId.HasValue;

    /// <summary><see langword="true" /> when <see cref="GraphSnapshotId" /> is set.</summary>
    public bool HasGraphSnapshot => GraphSnapshotId.HasValue;

    /// <summary><see langword="true" /> when <see cref="FindingsSnapshotId" /> is set.</summary>
    public bool HasFindingsSnapshot => FindingsSnapshotId.HasValue;

    /// <summary><see langword="true" /> when <see cref="GoldenManifestId" /> is set.</summary>
    public bool HasGoldenManifest => GoldenManifestId.HasValue;

    /// <summary><see langword="true" /> when <see cref="DecisionTraceId" /> is set.</summary>
    public bool HasDecisionTrace => DecisionTraceId.HasValue;

    /// <summary><see langword="true" /> when <see cref="ArtifactBundleId" /> is set.</summary>
    public bool HasArtifactBundle => ArtifactBundleId.HasValue;

    /// <summary>
    ///     <see langword="true" /> when the run used pilot simulator substitution after real execution could not complete
    ///     or at least one agent trace shows resource-level LLM fallback (deployment name prefixed with <c>fallback:</c>
    ///     in persisted traces).
    /// </summary>
    public bool RunDegradedExecution
    {
        get;
        set;
    }

    /// <summary>Distinct agent type names (sorted) that recorded resource-level LLM fallback on their traces.</summary>
    public IReadOnlyList<string> DegradedExecutionAgents
    {
        get;
        set;
    } = [];

    public Guid? ContextSnapshotId
    {
        get;
        set;
    }

    public Guid? GraphSnapshotId
    {
        get;
        set;
    }

    public Guid? FindingsSnapshotId
    {
        get;
        set;
    }

    public Guid? GoldenManifestId
    {
        get;
        set;
    }

    public Guid? DecisionTraceId
    {
        get;
        set;
    }

    public Guid? ArtifactBundleId
    {
        get;
        set;
    }

    /// <summary><see langword="true" /> when the run has associated warnings.</summary>
    public bool HasWarnings
    {
        get;
        set;
    }

    /// <summary><see langword="true" /> when the run has open governance alerts requiring operator attention.</summary>
    public bool HasGovernanceWarnings
    {
        get;
        set;
    }

    /// <summary>Package origin label for workspace list badges (TB-740).</summary>
    public string? PackageOrigin
    {
        get;
        set;
    }

    /// <summary>Structural execution mode roll-up for compare pickers and run lists (TB-2071).</summary>
    public StructuralExecutionMode StructuralExecutionMode
    {
        get;
        set;
    } = StructuralExecutionMode.Simulator;

    /// <summary>Authority pipeline lifecycle phase for list/compare surfaces (wave-6 suggestion 58).</summary>
    public AuthorityRunLifecyclePhase AuthorityLifecyclePhase
    {
        get;
        set;
    } = AuthorityRunLifecyclePhase.NotStarted;

    /// <summary>Coordinator legacy status for list badges when execute ownership reconciliation marks terminal failure (DR-06).</summary>
    public string? LegacyRunStatus
    {
        get;
        set;
    }
}
