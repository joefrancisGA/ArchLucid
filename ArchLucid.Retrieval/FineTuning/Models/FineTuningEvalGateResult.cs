namespace ArchLucid.Retrieval.FineTuning.Models;

/// <summary>Golden-cohort eval gate outcome comparing base vs. fine-tuned model quality.</summary>
public sealed class FineTuningEvalGateResult
{
    public bool Promoted
    {
        get;
        set;
    }

    public double BaseSupportRatio
    {
        get;
        set;
    }

    public double FineTunedSupportRatio
    {
        get;
        set;
    }

    public double RequiredSupportRatio
    {
        get;
        set;
    }

    public string Reason
    {
        get;
        set;
    } = string.Empty;
}
