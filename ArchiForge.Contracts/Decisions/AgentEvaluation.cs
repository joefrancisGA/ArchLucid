namespace ArchiForge.Contracts.Decisions;

/// <summary>
/// A lightweight, deterministic evaluation that supports or opposes a specific decision topic/option.
/// </summary>
public sealed class AgentEvaluation
{
    public string EvaluationId { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>Decision topic key, e.g. "Datastore:Redis".</summary>
    public string Topic { get; set; } = string.Empty;

    /// <summary>Optional: match by option description. If empty, applies to the selected option for the topic.</summary>
    public string? OptionDescription { get; set; }

    /// <summary>"support" or "oppose".</summary>
    public string EvaluationType { get; set; } = string.Empty;

    /// <summary>Signed delta. For oppose, the absolute value is treated as opposition magnitude.</summary>
    public double ConfidenceDelta { get; set; }

    public List<string> EvidenceRefs { get; set; } = [];
}

