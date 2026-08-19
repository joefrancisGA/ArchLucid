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

    public IReadOnlyList<string> AgentsWithTraces
    {
        get;
        set;
    } = [];

    /// <summary>RAG agents that executed but have no persisted grounding trace row.</summary>
    public IReadOnlyList<string> ExpectedAgentsMissingTraces
    {
        get;
        set;
    } = [];

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

    public int TotalGraphRagNeighborsAdded
    {
        get;
        set;
    }

    public int TotalGraphRagSeedHits
    {
        get;
        set;
    }

    public double GraphRagNeighborHitRate
    {
        get;
        set;
    }

    public int TotalRetrievalTokensIn
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
    public IReadOnlyList<string> TopologyReferenceArchitectureExemplarDocumentIds
    {
        get;
        set;
    } = [];

    /// <summary>True when Topology ran but no reference-architecture exemplar chunks were retrieved.</summary>
    public bool TopologyReferenceArchitectureExemplarMissing
    {
        get;
        set;
    }
}
