using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ArchitectureIntelligenceBenchmark
{
    public IReadOnlyList<ExtractionFidelityCase> GetHeldOutMicrocases()
    {
        return
        [
            new ExtractionFidelityCase
            {
                CaseId = "holdout-rpo-backup-mismatch",
                SourceText = "RPO is 15 minutes. Database backups run nightly only. No transaction log shipping.",
                ExpectedElementKinds = [ArchitectureElementKind.RecoveryObjective, ArchitectureElementKind.Constraint],
                ExpectedNames = ["Recovery objective", "backup"]
            },
            new ExtractionFidelityCase
            {
                CaseId = "holdout-intentional-tradeoff",
                SourceText = "We accept single-region deployment to reduce cost; regional outage risk is an approved trade-off.",
                ExpectedElementKinds = [ArchitectureElementKind.TradeOff, ArchitectureElementKind.Decision],
                ExpectedNames = ["trade-off", "Single-region"]
            }
        ];
    }

    public IReadOnlyList<ExtractionFidelityScore> ScoreHeldOutExtraction(IDifficultyBasedExtractionRouter router)
    {
        ArgumentNullException.ThrowIfNull(router);

        return _extractionFidelityBenchmark.ScoreCases(router, GetHeldOutMicrocases());
    }
}
