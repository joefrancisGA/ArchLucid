namespace ArchLucid.Core.QualityGates;

/// <summary>
///     Evaluate-time quality scores and triage metadata persisted with the gate snapshot (TB-964).
///     Buyer-safe fields only — no prompts or raw completions.
/// </summary>
public sealed class QualityGateRecordedEvaluationSnapshot
{
    public double StructuralCompletenessRatio
    {
        get;
        init;
    }

    public double SemanticScore
    {
        get;
        init;
    }

    /// <summary>Stable category label (structural / semantic / faithfulness / none).</summary>
    public string RejectReasonCategory
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Optional triage scenario id from <see cref="Contracts.Agents.RealAgentFailureTriageScenarioIds" />.</summary>
    public string? TriageScenarioId
    {
        get;
        init;
    }
}
