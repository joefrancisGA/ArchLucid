// Type aliases avoid importing sibling namespace `...Alerts.Composite` (bare `Composite` → CS0118 here).
using AlertRuleCondition = ArchLucid.Contracts.Alerts.Composite.AlertRuleCondition;
using CompositeAlertRule = ArchLucid.Contracts.Alerts.Composite.CompositeAlertRule;
using ArchLucid.Contracts.Alerts.Simulation;
using ArchLucid.Contracts.Alerts.Tuning;
using ArchLucid.Decisioning.Alerts.Simulation;

namespace ArchLucid.Decisioning.Alerts.Tuning;

/// <summary>
///     Sweeps <see cref="ThresholdRecommendationRequest.CandidateThresholds" /> via <see cref="IRuleSimulationService" />
///     and ranks results with <see cref="IAlertNoiseScorer" />.
/// </summary>
/// <param name="simulationService">Dry-run evaluator over historical contexts.</param>
/// <param name="noiseScorer">Heuristic ranking of each simulation.</param>
public sealed partial class ThresholdRecommendationService(
    IRuleSimulationService simulationService,
    IAlertNoiseScorer noiseScorer) : IThresholdRecommendationService
{
    private const string RuleKindSimple = RuleKindConstants.Simple;
    private const string DefaultProjectSlug = "default";
    private const string RuleKindComposite = RuleKindConstants.Composite;
}
