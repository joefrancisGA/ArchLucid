namespace ArchLucid.Contracts.Explanation;

/// <summary>
/// Redacted LLM prompt/response audit slice for one finding, aligned with persisted <see cref="Agents.AgentExecutionTrace"/> rows.
/// </summary>
public sealed class FindingLlmAuditResult
{
    /// <summary>Agent execution trace id (32-char hex).</summary>
    public string TraceId { get; set; } = string.Empty;

    /// <summary>Agent role for this trace (e.g. Topology).</summary>
    public string AgentType { get; set; } = string.Empty;

    public string SystemPromptRedacted { get; set; } = string.Empty;

    public string UserPromptRedacted { get; set; } = string.Empty;

    public string RawResponseRedacted { get; set; } = string.Empty;

    public string? ModelDeploymentName { get; set; }

    public string? ModelVersion { get; set; }

    /// <summary>Merged deny-list redaction hit counts across the three text fields.</summary>
    public Dictionary<string, int> RedactionCountsByCategory { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
