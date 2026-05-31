using System.Text.Json.Serialization;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Contracts.Runs;
using ArchLucid.Contracts.Trust;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Queries;

/// <summary>
///     Aggregated read model for a single run: core <see cref="RunRecord" /> plus optional hydrated snapshots and
///     manifest.
/// </summary>
/// <remarks>
///     Returned directly from <c>GET api/authority/runs/{runId}</c> (<c>AuthorityQueryController</c>) as JSON; clients
///     receive embedded domain models for that route.
///     Adding serializable properties on <see cref="RunRecord" /> changes the OpenAPI schema; refresh
///     <c>ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json</c> with
///     <c>ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1 dotnet test --filter OpenApiContractSnapshotTests</c> (see
///     <c>OpenApiContractSnapshotTests</c>).
/// </remarks>
public class RunDetailDto
{
    /// <summary>Canonical run row (ids, metadata).</summary>
    public RunRecord Run
    {
        get;
        set;
    } = null!;

    /// <summary>
    ///     Sponsor-safe one-liner for agent execution (simulator vs live vs fallback), derived from <see cref="RunRecord" />
    ///     and <c>AgentExecution:Mode</c> on the API host at request time.
    /// </summary>
    public string? ExecutionFlavorBuyerSummary
    {
        get;
        set;
    }

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

    /// <summary>
    ///     <see langword="true" /> when finding-engine coverage was partial or enrichment was skipped; distinct from
    ///     <see cref="RunDegradedExecution" /> (agent/simulator fallback).
    /// </summary>
    public bool DegradedFindingCoverage
    {
        get;
        set;
    }

    /// <summary>Structured finding-engine coverage summary when a findings snapshot is hydrated.</summary>
    public RunFindingCoverageSummary? FindingCoverageSummary
    {
        get;
        set;
    }

    /// <summary>Context payload when <see cref="RunRecord.ContextSnapshotId" /> resolves.</summary>
    public ContextSnapshot? ContextSnapshot
    {
        get;
        set;
    }

    /// <summary>Graph payload when <see cref="RunRecord.GraphSnapshotId" /> resolves.</summary>
    public GraphSnapshot? GraphSnapshot
    {
        get;
        set;
    }

    /// <summary>Findings payload when <see cref="RunRecord.FindingsSnapshotId" /> resolves.</summary>
    public FindingsSnapshot? FindingsSnapshot
    {
        get;
        set;
    }

    /// <summary>Authority rule-audit trace when <see cref="RunRecord.DecisionTraceId" /> resolves.</summary>
    [JsonPropertyName("decisionTrace")]
    public DecisionTraceDto? AuthorityTrace
    {
        get;
        set;
    }

    /// <summary>Golden manifest when <see cref="RunRecord.GoldenManifestId" /> resolves.</summary>
    public ManifestDocument? GoldenManifest
    {
        get;
        set;
    }

    /// <summary>Synthesized artifacts when both bundle and manifest ids are present and lookup succeeds.</summary>
    public ArtifactBundle? ArtifactBundle
    {
        get;
        set;
    }

    /// <summary>Agent task results for this run (architecture pipeline; TB-106).</summary>
    public List<AgentResult>? Results
    {
        get;
        set;
    }

    /// <summary>Summed LLM token usage and USD estimate from persisted execution traces.</summary>
    public RunAgentLlmCostEstimateDto? AgentExecutionLlmCostEstimate
    {
        get;
        set;
    }

    /// <summary>Self-attested trust evidence for committed runs only.</summary>
    public RunTrustEvidenceCard? TrustEvidenceCard
    {
        get;
        set;
    }

    /// <summary>Rollup of persisted retrieval grounding traces for operator decision surfaces.</summary>
    public RunRetrievalGroundingSummaryDto? RetrievalGroundingSummary
    {
        get;
        set;
    }

    /// <summary>Parsed agent execution failure summary when the run last failed (no raw LLM body).</summary>
    public AgentExecutionFailureSummary? LastAgentExecutionFailure
    {
        get;
        set;
    }

    /// <summary>Server-authoritative estimated USD savings from the findings snapshot (executive ROI resolver).</summary>
    public RunEstimatedUsdSavingsDto? EstimatedUsdSavingsSummary
    {
        get;
        set;
    }
}

