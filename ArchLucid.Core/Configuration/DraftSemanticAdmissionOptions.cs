namespace ArchLucid.Core.Configuration;

/// <summary>Configurable LLM semantic/domain-fit admission for Socratic draft intake (ADR 0055).</summary>
public sealed class DraftSemanticAdmissionOptions
{
    public const string SectionName = "DraftSemanticAdmission";

    /// <summary>When false, admission uses the deterministic domain heuristic only.</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>When the LLM evaluator is unavailable, admit after heuristic checks instead of redirecting.</summary>
    public bool FailOpenOnEvaluatorUnavailable
    {
        get;
        set;
    } = true;
}
