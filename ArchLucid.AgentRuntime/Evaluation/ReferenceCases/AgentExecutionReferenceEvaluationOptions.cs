namespace ArchLucid.AgentRuntime.Evaluation.ReferenceCases;

/// <summary>Optional JSON reference cases scored after runs (structural + semantic vs thresholds).</summary>
public sealed class AgentExecutionReferenceEvaluationOptions
{
    public const string SectionPath = "AgentExecution:ReferenceEvaluation";

    /// <summary>When false, reference-case scoring and SQL append are skipped.</summary>
    public bool Enabled
    {
        get; set;
    }

    /// <summary>Path to a JSON array of <see cref="AgentOutputReferenceCaseDefinition"/>; relative paths resolve from host content root.</summary>
    public string? ReferenceCasesPath
    {
        get; set;
    }
}
