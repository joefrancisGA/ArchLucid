using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Operator-facing rollup of persisted retrieval grounding traces for a run (assessment #5).
/// </summary>
public sealed class RunRetrievalGroundingSummaryDto
{
    public int TraceCount
    {
        get;
        set;
    }

    private IReadOnlyList<string> agentsWithTraces = [];

    public IReadOnlyList<string> AgentsWithTraces
    {
        get => agentsWithTraces;
        set => agentsWithTraces = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>RAG agents that executed but have no persisted grounding trace row.</summary>
    private IReadOnlyList<string> expectedAgentsMissingTraces = [];

    public IReadOnlyList<string> ExpectedAgentsMissingTraces
    {
        get => expectedAgentsMissingTraces;
        set => expectedAgentsMissingTraces = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public double AverageCitationCoverage
    {
        get;
        set;
    }

    public int TotalRetrievedChunks
    {
        get;
        set;
    }

    /// <summary>PASS, WARN, or HOLD — aligned with sponsor-handoff vocabulary.</summary>
    public string Disposition
    {
        get;
        set;
    } = "WARN";

    public string? OperatorDetail
    {
        get;
        set;
    }

    public int? TotalGraphRagNeighborsAdded
    {
        get;
        set;
    }

    public int? TotalGraphRagSeedHits
    {
        get;
        set;
    }

    public double? GraphRagNeighborHitRate
    {
        get;
        set;
    }

    public int? TotalRetrievalTokensIn
    {
        get;
        set;
    }

    /// <summary>PASS, WARN, or HOLD — Graph-RAG pilot floor when neighbor share is high with low citation coverage.</summary>
    public string GraphRagPilotFloorDisposition
    {
        get;
        set;
    } = "PASS";

    /// <summary>proven or unproven — Azure AI Search posture when Graph-RAG expansion contributed chunks (TB-596).</summary>
    public string? GraphRagQualityPosture
    {
        get;
        set;
    }

    /// <summary>Reference-architecture exemplar chunks retrieved for Topology style prior (TB-663).</summary>
    public int TopologyReferenceArchitectureExemplarCount
    {
        get;
        set;
    }

    /// <summary>Distinct exemplar document ids from Topology grounding traces (redaction-safe ids only).</summary>
    private IReadOnlyList<string> topologyReferenceArchitectureExemplarDocumentIds = [];

    public IReadOnlyList<string> TopologyReferenceArchitectureExemplarDocumentIds
    {
        get => topologyReferenceArchitectureExemplarDocumentIds;
        set => topologyReferenceArchitectureExemplarDocumentIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>True when Topology ran but no reference-architecture exemplar chunks were retrieved.</summary>
    public bool TopologyReferenceArchitectureExemplarMissing
    {
        get;
        set;
    }
}
