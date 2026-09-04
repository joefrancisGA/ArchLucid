using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Simulation;
using ArchLucid.Contracts.Alerts.Tuning;
using CompositeAlertRule = ArchLucid.Contracts.Alerts.Composite.CompositeAlertRule;

namespace ArchLucid.Decisioning.Alerts.Tuning;

public sealed partial class ThresholdRecommendationService
{
    /// <inheritdoc />
    public async Task<ArchLucid.Contracts.Alerts.Tuning.ThresholdRecommendationResult> RecommendAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        ArchLucid.Contracts.Alerts.Tuning.ThresholdRecommendationRequest request,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);

        ArchLucid.Contracts.Alerts.Tuning.ThresholdRecommendationResult result = new() { EvaluatedUtc = TimeProvider.System.UtcNowDateTime(), RuleKind = request.RuleKind, TunedMetricType = request.TunedMetricType };

        string slug = string.IsNullOrWhiteSpace(request.RunProjectSlug)
            ? DefaultProjectSlug
            : request.RunProjectSlug.Trim();

        foreach (decimal threshold in request.CandidateThresholds.Distinct().OrderBy(x => x))
        {
            RuleSimulationResult? simulation;

            if (request.RuleKind.Equals(RuleKindSimple, StringComparison.OrdinalIgnoreCase) &&
                request.BaseSimpleRule is not null)
            {
                AlertRule baseRule = AlignSimpleRuleMetric(request.BaseSimpleRule, request.TunedMetricType);
                AlertRule candidateRule = CloneSimpleRuleWithThreshold(baseRule, threshold);

                simulation = await simulationService
                        .SimulateAsync(
                            tenantId,
                            workspaceId,
                            projectId,
                            new RuleSimulationRequest
                            {
                                RuleKind = RuleKindSimple,
                                SimpleRule = candidateRule,
                                RecentRunCount = request.RecentRunCount,
                                UseHistoricalWindow = true,
                                RunProjectSlug = slug
                            },
                            ct)
                    ;
            }
            else if (request.RuleKind.Equals(RuleKindComposite, StringComparison.OrdinalIgnoreCase) &&
                     request.BaseCompositeRule is not null)
            {
                CompositeAlertRule candidateRule = CloneCompositeRuleWithThreshold(
                    request.BaseCompositeRule,
                    request.TunedMetricType,
                    threshold);

                simulation = await simulationService
                        .SimulateAsync(
                            tenantId,
                            workspaceId,
                            projectId,
                            new RuleSimulationRequest
                            {
                                RuleKind = RuleKindComposite,
                                CompositeRule = candidateRule,
                                RecentRunCount = request.RecentRunCount,
                                UseHistoricalWindow = true,
                                RunProjectSlug = slug
                            },
                            ct)
                    ;
            }
            else

                continue;

            NoiseScoreBreakdown score = noiseScorer.Score(
                simulation,
                request.TargetCreatedAlertCountMin,
                request.TargetCreatedAlertCountMax);

            result.Candidates.Add(
                new ThresholdCandidateEvaluation
                {
                    Candidate = new ThresholdCandidate { ThresholdValue = threshold, Label = threshold.ToString("0.##") },
                    SimulationResult = simulation,
                    ScoreBreakdown = score
                });
        }

        RankRecommendedCandidate(result);

        return result;
    }
}
