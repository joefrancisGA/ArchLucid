namespace ArchLucid.Retrieval.FineTuning;

/// <summary>Configuration for RAG-V2-003 manifest online fine-tuning (TB-594).</summary>
public sealed class FineTuningOptions
{
    public const string SectionPath = "Retrieval:FineTuning";

    /// <summary>When false, job orchestration is disabled and exports may still run for audit-only dry runs.</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Azure OpenAI base model deployment used to seed fine-tuning jobs.</summary>
    public string BaseModelDeploymentName
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Minimum golden-cohort faithfulness support ratio required to promote a fine-tuned model.</summary>
    public double MinEvalSupportRatio
    {
        get;
        set;
    } = 0.80;

    /// <summary>Maximum committed manifests exported per batch.</summary>
    public int MaxManifestsPerExport
    {
        get;
        set;
    } = 100;
}
