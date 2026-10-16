using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Lightweight run row for governance lineage (coordinator <see cref="Metadata.ArchitectureRun" /> projection).
/// </summary>
public sealed class GovernanceLineageRunSummary
{
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string Status
    {
        get;
        set;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public DateTime? CompletedUtc
    {
        get;
        set;
    }

    public string? CurrentManifestVersion
    {
        get;
        set;
    }
}

/// <summary>
///     Manifest counts for lineage when an authority golden manifest is available.
/// </summary>
public sealed class GovernanceLineageManifestSummary
{
    public string? ManifestVersion
    {
        get;
        set;
    }

    public int DecisionCount
    {
        get;
        set;
    }

    public int UnresolvedIssueCount
    {
        get;
        set;
    }

    public int ComplianceGapCount
    {
        get;
        set;
    }
}

/// <summary>
///     One finding row in lineage, including explainability completeness for operator triage.
/// </summary>
public sealed class GovernanceLineageFindingSummary
{
    public string FindingId
    {
        get;
        set;
    } = string.Empty;

    public string Title
    {
        get;
        set;
    } = string.Empty;

    public string EngineType
    {
        get;
        set;
    } = string.Empty;

    public string Severity
    {
        get;
        set;
    } = string.Empty;

    public double TraceCompletenessRatio
    {
        get;
        set;
    }

    /// <summary>
    ///     Optional link to <c>AgentExecutionTrace.traceId</c> when the finding records
    ///     <c>sourceAgentExecutionTraceId</c>.
    /// </summary>
    public string? SourceAgentExecutionTraceId
    {
        get;
        set;
    }
}

/// <summary>
///     Joins a governance approval request to run, authority manifest/findings (when linked), and promotion history.
/// </summary>
public sealed class GovernanceLineageResult
{
    private GovernanceApprovalRequest approvalRequest = new();

    public GovernanceApprovalRequest ApprovalRequest
    {
        get => approvalRequest;
        set => approvalRequest = value ?? new GovernanceApprovalRequest();
    }

    public GovernanceLineageRunSummary? Run
    {
        get;
        set;
    }

    public GovernanceLineageManifestSummary? Manifest
    {
        get;
        set;
    }

    private List<GovernanceLineageFindingSummary> topFindings = [];

    public List<GovernanceLineageFindingSummary> TopFindings
    {
        get => topFindings;
        set => topFindings = ContractCollectionDefaults.Coalesce(value);
    }

    public string? RiskPosture
    {
        get;
        set;
    }

    private List<GovernancePromotionRecord> promotions = [];

    public List<GovernancePromotionRecord> Promotions
    {
        get => promotions;
        set => promotions = ContractCollectionDefaults.Coalesce(value);
    }
}
