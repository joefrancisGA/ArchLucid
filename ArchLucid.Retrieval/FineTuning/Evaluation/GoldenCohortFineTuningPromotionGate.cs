using ArchLucid.Retrieval.FineTuning.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.FineTuning.Evaluation;

/// <summary>
///     Compares fine-tuned vs. base golden-cohort faithfulness support ratios (TB-594 Phase 3).
/// </summary>
public sealed class GoldenCohortFineTuningPromotionGate(IOptionsMonitor<FineTuningOptions> options)
    : IFineTuningPromotionGate
{
    private readonly IOptionsMonitor<FineTuningOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    /// <inheritdoc />
    public FineTuningEvalGateResult Evaluate(double baseSupportRatio, double fineTunedSupportRatio)
    {
        double required = _options.CurrentValue.MinEvalSupportRatio;

        if (fineTunedSupportRatio < required)
        {
            return new FineTuningEvalGateResult
            {
                Promoted = false,
                BaseSupportRatio = baseSupportRatio,
                FineTunedSupportRatio = fineTunedSupportRatio,
                RequiredSupportRatio = required,
                Reason = $"Fine-tuned support ratio {fineTunedSupportRatio:F3} is below required floor {required:F3}.",
            };
        }

        if (fineTunedSupportRatio < baseSupportRatio)
        {
            return new FineTuningEvalGateResult
            {
                Promoted = false,
                BaseSupportRatio = baseSupportRatio,
                FineTunedSupportRatio = fineTunedSupportRatio,
                RequiredSupportRatio = required,
                Reason = "Fine-tuned model regressed versus base model on golden cohort.",
            };
        }

        return new FineTuningEvalGateResult
        {
            Promoted = true,
            BaseSupportRatio = baseSupportRatio,
            FineTunedSupportRatio = fineTunedSupportRatio,
            RequiredSupportRatio = required,
            Reason = "Fine-tuned model meets golden-cohort promotion criteria.",
        };
    }
}
