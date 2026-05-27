namespace ArchLucid.Contracts.Explanation;

/// <summary>
///     Read-only pointers linking one findings-snapshot finding to persisted run artifacts (ADR 0021 read-path
///     explainability).
/// </summary>
public sealed class FindingEvidenceChainResponse
{
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string FindingId
    {
        get;
        set;
    } = string.Empty;

    public string? ManifestVersion
    {
        get;
        set;
    }

    public Guid? FindingsSnapshotId
    {
        get;
        set;
    }

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

    public Guid? DecisionTraceId
    {
        get;
        set;
    }

    public Guid? GoldenManifestId
    {
        get;
        set;
    }

    public IReadOnlyList<string> RelatedGraphNodeIds
    {
        get;
        set;
    } = [];

    public IReadOnlyList<string> AgentExecutionTraceIds
    {
        get;
        set;
    } = [];

    /// <summary>Retrieval grounding trace row ids for this run (forensic index).</summary>
    public IReadOnlyList<string> RetrievalGroundingTraceIds
    {
        get;
        set;
    } = [];

    /// <summary>Agent trace pointers with model deployment metadata (no prompt text).</summary>
    public IReadOnlyList<FindingForensicAgentTracePointer> AgentTracePointers
    {
        get;
        set;
    } = [];

    /// <summary>Retrieval grounding pointers with corpus and citation coverage.</summary>
    public IReadOnlyList<FindingForensicRetrievalGroundingPointer> RetrievalGroundingPointers
    {
        get;
        set;
    } = [];

    /// <summary>Distinct audit correlation ids for run-scoped events when present.</summary>
    public IReadOnlyList<string> AuditCorrelationIds
    {
        get;
        set;
    } = [];

    /// <summary>Operator hint for support bundle / trace forensics (no secrets).</summary>
    public string? SupportHint
    {
        get;
        set;
    }
}
