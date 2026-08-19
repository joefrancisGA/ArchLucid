using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Runs;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Interfaces;

using Cm = ArchLucid.Contracts.Manifest;
using Dm = ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>Inputs for <see cref="IManifestFinalizationService.FinalizeAsync" /> (authority commit phase).</summary>
public sealed class ManifestFinalizationRequest
{
    public required Guid RunId
    {
        get;
        init;
    }

    /// <summary>Must match <c>dbo.Runs.FindingsSnapshotId</c> at finalization time.</summary>
    public required Guid ExpectedFindingsSnapshotId
    {
        get;
        init;
    }

    /// <summary>
    ///     When non-null, must match <c>dbo.Runs.ArtifactBundleId</c> (pipeline linked artifacts). When the run has no bundle
    ///     yet, leave null.
    /// </summary>
    public Guid? ExpectedArtifactBundleId
    {
        get;
        init;
    }

    public required string ActorUserId
    {
        get;
        init;
    }

    public required string ActorUserName
    {
        get;
        init;
    }

    public string? CorrelationId
    {
        get;
        init;
    }

    public required ManifestDocument ManifestModel
    {
        get;
        init;
    }

    public required Cm.GoldenManifest Contract
    {
        get;
        init;
    }

    public required SaveContractsManifestOptions Keying
    {
        get;
        init;
    }

    public required DecisionTrace Trace
    {
        get;
        init;
    }

    /// <summary>When set, finalization skips reloading the findings snapshot row (TB-588).</summary>
    public FindingsSnapshot? PreloadedFindingsSnapshot
    {
        get;
        init;
    }

    /// <summary>When set, governance snapshot capture skips reloading scope assignments (TB-588).</summary>
    public IReadOnlyList<PolicyPackAssignment>? PreloadedScopePolicyPackAssignments
    {
        get;
        init;
    }

    /// <summary>When set, review standards snapshot capture skips reloading the architecture request (TB-2345).</summary>
    public ArchitectureRequest? PreloadedArchitectureRequest
    {
        get;
        init;
    }

    /// <summary>
    ///     When true, decision trace and golden manifest rows were already persisted during inline authority pipeline
    ///     execution (non-deferred create); finalization only transitions the run header to Committed.
    /// </summary>
    public bool SkipPersistingPipelineArtifacts
    {
        get;
        init;
    }

    public ReadyForCommitRun? ReadyForCommitHandle
    {
        get;
        init;
    }
}
