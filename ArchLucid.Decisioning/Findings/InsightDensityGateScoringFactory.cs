using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Builds snapshot-scoped insight-density gates with diagram package indexes (QR-09).</summary>
public static class InsightDensityGateScoringFactory
{
    public static IInsightDensityGate CreateScoringGate(
        IInsightDensityGate gate,
        InsightDensityGateOptions options,
        GraphSnapshot? graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(gate);
        ArgumentNullException.ThrowIfNull(options);

        if (graphSnapshot is null)
        {
            return gate;
        }

        InsightDensityGateOptions scoringOptions = CloneOptions(options);
        scoringOptions.PackageDiagramCitationIndex =
            DiagramPackageCitationIndexBuilder.FromGraphSnapshot(graphSnapshot);

        return new DeterministicInsightDensityGate(Options.Create(scoringOptions));
    }

    public static IInsightDensityGate CreateScoringGate(
        InsightDensityGateOptions options,
        GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        return CreateScoringGate(DeterministicInsightDensityGate.CreateDefault(), options, graphSnapshot);
    }

    internal static InsightDensityGateOptions CloneOptions(InsightDensityGateOptions source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new InsightDensityGateOptions
        {
            DemotionThreshold = source.DemotionThreshold,
            HighDuplicationSimilarityThreshold = source.HighDuplicationSimilarityThreshold,
            ModerateDuplicationSimilarityThreshold = source.ModerateDuplicationSimilarityThreshold,
            EnableLlmJudge = source.EnableLlmJudge,
            MaxJudgedFindingsPerSnapshot = source.MaxJudgedFindingsPerSnapshot,
            EnableLlmJudgeForEngineFindings = source.EnableLlmJudgeForEngineFindings,
            EnableInsightGenerator = source.EnableInsightGenerator,
            MaxGeneratedInsightFindingsPerSnapshot = source.MaxGeneratedInsightFindingsPerSnapshot,
            PreferHighNoveltyEngines = source.PreferHighNoveltyEngines,
            NoveltyRateWindowDays = source.NoveltyRateWindowDays,
            EnableProseAssumptionExtraction = source.EnableProseAssumptionExtraction,
            MaxProseAssumptionCandidatesPerSnapshot = source.MaxProseAssumptionCandidatesPerSnapshot,
            MaxProseAssumptionFindingsPerSnapshot = source.MaxProseAssumptionFindingsPerSnapshot,
            PreferHighVerificationEngines = source.PreferHighVerificationEngines,
            VerificationPriorMinSample = source.VerificationPriorMinSample,
            VerificationPriorWindowDays = source.VerificationPriorWindowDays,
            PreferHighHumanAcceptResidual = source.PreferHighHumanAcceptResidual,
        };
    }
}
