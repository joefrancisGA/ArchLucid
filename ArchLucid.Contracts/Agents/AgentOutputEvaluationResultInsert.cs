using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Agents;

/// <summary>Row to append to <c>dbo.AgentOutputEvaluationResults</c> after reference-case scoring.</summary>
public sealed class AgentOutputEvaluationResultInsert
{
    public string RunId { get; set; } = string.Empty;

    public string TraceId { get; set; } = string.Empty;

    public string CaseId { get; set; } = string.Empty;

    public AgentType AgentType { get; set; }

    public double OverallScore { get; set; }

    public double? StructuralMatch { get; set; }

    public double? SemanticMatch { get; set; }

    public string? MissingKeysJson { get; set; }

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
}
