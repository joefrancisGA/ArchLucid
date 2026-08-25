using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     The output produced by an agent after completing its assigned <see cref="AgentTask" />.
///     Contains claims, evidence references, findings, proposed manifest changes, and
///     a confidence score used by the decision engine during manifest synthesis.
/// </summary>
[JsonConverter(typeof(AgentResultJsonConverter))]
public sealed class AgentResult
{
    /// <summary>Unique result identifier, generated at creation time.</summary>
    [Required]
    public string ResultId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    /// <summary>Identifier of the <see cref="AgentTask" /> this result fulfills.</summary>
    [Required]
    public string TaskId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Run identifier shared with the originating task.</summary>
    [Required]
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Type of agent that produced this result.</summary>
    [Required]
    public AgentType AgentType
    {
        get;
        set;
    }

    /// <summary>
    ///     Natural-language claims produced by the agent supporting its proposed architecture changes.
    /// </summary>
    [Required]
    [JsonConverter(typeof(AgentResultClaimListJsonConverter))]
    public List<string> Claims
    {
        get;
        set;
    } = [];

    /// <summary>
    ///     References to evidence items (policy IDs, service catalog IDs, pattern IDs, etc.) that
    ///     the agent used to justify its claims.
    /// </summary>
    [Required]
    public List<string> EvidenceRefs
    {
        get;
        set;
    } = [];

    /// <summary>
    ///     Agent's self-reported confidence in its result, in the range [0.0, 1.0].
    ///     The decision engine weights this when resolving conflicting proposals.
    /// </summary>
    [Range(0.0, 1.0)]
    public double Confidence
    {
        get;
        set;
    }

    /// <summary>
    ///     Confidence mapped to historical semantic evaluation scores for this <see cref="AgentType" />.
    ///     Populated after post-execution evaluation when calibration is enabled; null until then.
    /// </summary>
    [Range(0.0, 1.0)]
    public double? CalibratedConfidence
    {
        get;
        set;
    }

    /// <summary>Architecture findings identified by the agent (security gaps, topology issues, etc.).</summary>
    public List<ArchitectureFinding> Findings
    {
        get;
        set;
    } = [];

    /// <summary>Hygiene observations routed to checklist coverage instead of decision-grade findings (TB-384).</summary>
    public List<ArchitectureFinding> ChecklistCoverage
    {
        get;
        set;
    } = [];

    /// <summary>Insight-density demotion vs retention counts when populated by the agent runtime gate (TB-385).</summary>
    public InsightDensityCurationSummary? InsightDensityCuration
    {
        get;
        set;
    }

    /// <summary>
    ///     Proposed additions and removals to the golden manifest.
    ///     <see langword="null" /> when the agent has no structural proposals (e.g. evaluation-only agents).
    /// </summary>
    [JsonConverter(typeof(AgentTopologyProposalJsonConverter))]
    public AgentTopologyProposal? ProposedChanges
    {
        get;
        set;
    }

    /// <summary>
    ///     Detailed reasoning trace explaining how the agent arrived at these claims and findings.
    /// </summary>
    public string? ReasoningTrace
    {
        get;
        set;
    }

    /// <summary>
    ///     Source citations linking AI-generated findings to specific policies or evidence.
    /// </summary>
    public IEnumerable<Citation>? Citations
    {
        get;
        set;
    }

    /// <summary>UTC timestamp when this result was created.</summary>
    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    /// <summary>
    ///     Optional agent-proposed catalog evidence (persisted in <c>dbo.AgentResults.ProposedEvidenceJson</c>, not inside
    ///     <see cref="ResultJson" /> payload).
    /// </summary>
    [JsonIgnore]
    public string? ProposedEvidenceJson
    {
        get;
        set;
    }

    /// <summary>
    ///     Prompt A/B variant key when <c>AgentRuntime:PromptVariants:Enabled</c> is true (also stored in
    ///     <c>dbo.AgentResults.PromptVariantKey</c>).
    /// </summary>
    [JsonIgnore]
    public string? PromptVariantKey
    {
        get;
        set;
    }

    /// <summary>
    ///     Optional retrieval grounding trace metrics for offline evaluation.
    /// </summary>
    public AgentResultRetrievalGroundingTrace? RetrievalGroundingTrace
    {
        get;
        set;
    }

    /// <summary>
    ///     Set when <see cref="AgentHandlerDegradedResultFactory" /> returns a placeholder row. Persisted in
    ///     <c>ResultJson</c> so idempotent execute retries can re-invoke degraded tasks; not part of LLM output schema.
    /// </summary>
    public string? DegradationReasonCode
    {
        get;
        set;
    }

    /// <summary>
    ///     Final structural execution mode for this task after execute or selective resume (INV-002 / TB-970).
    ///     Also persisted in <c>dbo.AgentResults.TaskStructuralExecutionMode</c>.
    /// </summary>
    public StructuralExecutionMode? TaskStructuralExecutionMode
    {
        get;
        set;
    }

    /// <summary>
    ///     When true, the task completion was served from LLM response cache; disclosure-only (TB-970).
    ///     Also persisted in <c>dbo.AgentResults.CacheServed</c>.
    /// </summary>
    public bool CacheServed
    {
        get;
        set;
    }

    /// <summary>
    ///     Upstream required-agent <see cref="ResultId"/> values captured when this dependent agent completed (TB-942).
    /// </summary>
    public Dictionary<string, string>? UpstreamResultFingerprints
    {
        get;
        set;
    }
}
