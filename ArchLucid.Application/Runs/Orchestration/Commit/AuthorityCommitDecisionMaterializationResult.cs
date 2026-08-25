using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Persistence.Models;

using Cm = ArchLucid.Contracts.Manifest;
using DecisionTraceDto = ArchLucid.Contracts.Persistence.DecisionTraces.DecisionTraceDto;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>
///     Outcome of authority commit decision materialization: manifest model, contract projection, trace, and
///     preloaded snapshots retained for finalization and telemetry.
/// </summary>
public sealed class AuthorityCommitDecisionMaterializationResult
{
    public required ManifestDocument ManifestModel { get; init; }

    public required DecisionTraceDto TraceDto { get; init; }

    public required DecisionTrace Trace { get; init; }

    public required Cm.GoldenManifest Contract { get; init; }

    public required string ContractWireJson { get; init; }

    public required AgentEvidencePackage EvidencePackageForTelemetry { get; init; }

    public required IReadOnlyList<AgentResult> AgentResultsForTelemetry { get; init; }

    public required FindingsSnapshot FindingsForFinalization { get; init; }

    public required IReadOnlyList<PolicyPackAssignment> ScopePolicyPackAssignments { get; init; }

    public required bool SkipPersistingPipelineArtifacts { get; init; }
}
