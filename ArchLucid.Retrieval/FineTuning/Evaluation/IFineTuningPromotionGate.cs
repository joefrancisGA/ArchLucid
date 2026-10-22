using ArchLucid.Retrieval.FineTuning.Models;

namespace ArchLucid.Retrieval.FineTuning.Evaluation;

/// <summary>Golden-cohort eval gate before promoting a fine-tuned deployment.</summary>
public interface IFineTuningPromotionGate
{
    FineTuningEvalGateResult Evaluate(double baseSupportRatio, double fineTunedSupportRatio);
}
