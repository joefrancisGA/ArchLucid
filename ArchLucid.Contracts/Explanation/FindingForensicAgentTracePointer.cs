namespace ArchLucid.Contracts.Explanation;

/// <summary>Opaque agent trace pointer for finding forensic read (no prompt bodies).</summary>
public sealed class FindingForensicAgentTracePointer
{
    public string TraceId { get; set; } = string.Empty;

    public string? AgentType { get; set; }

    public string? ModelDeploymentName { get; set; }

    public bool FullPromptBlobAvailable { get; set; }

    public bool FullResponseBlobAvailable { get; set; }

    public bool InlineFallbackFailed { get; set; }

    public string? ProvenanceCorrelationId { get; set; }
}
