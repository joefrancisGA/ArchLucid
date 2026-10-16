using ArchLucid.Contracts.Serialization;

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

    private IReadOnlyList<string> relatedGraphNodeIds = [];

    public IReadOnlyList<string> RelatedGraphNodeIds
    {
        get => relatedGraphNodeIds;
        set => relatedGraphNodeIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> agentExecutionTraceIds = [];

    public IReadOnlyList<string> AgentExecutionTraceIds
    {
        get => agentExecutionTraceIds;
        set => agentExecutionTraceIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Retrieval grounding trace row ids for this run (forensic index).</summary>
    private IReadOnlyList<string> retrievalGroundingTraceIds = [];

    public IReadOnlyList<string> RetrievalGroundingTraceIds
    {
        get => retrievalGroundingTraceIds;
        set => retrievalGroundingTraceIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Agent trace pointers with model deployment metadata (no prompt text).</summary>
    private IReadOnlyList<FindingForensicAgentTracePointer> agentTracePointers = [];

    public IReadOnlyList<FindingForensicAgentTracePointer> AgentTracePointers
    {
        get => agentTracePointers;
        set => agentTracePointers = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Retrieval grounding pointers with corpus and citation coverage.</summary>
    private IReadOnlyList<FindingForensicRetrievalGroundingPointer> retrievalGroundingPointers = [];

    public IReadOnlyList<FindingForensicRetrievalGroundingPointer> RetrievalGroundingPointers
    {
        get => retrievalGroundingPointers;
        set => retrievalGroundingPointers = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Distinct audit correlation ids for run-scoped events when present.</summary>
    private IReadOnlyList<string> auditCorrelationIds = [];

    public IReadOnlyList<string> AuditCorrelationIds
    {
        get => auditCorrelationIds;
        set => auditCorrelationIds = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Operator hint for support bundle / trace forensics (no secrets).</summary>
    public string? SupportHint
    {
        get;
        set;
    }
}
