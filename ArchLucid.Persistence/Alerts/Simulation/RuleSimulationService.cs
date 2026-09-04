
namespace ArchLucid.Persistence.Alerts.Simulation;

/// <summary>
/// Default <see cref="IRuleSimulationService"/>: replays rules against contexts from <see cref="IAlertSimulationContextProvider"/> without persisting simple-rule alerts; composite path uses live suppression reads.
/// </summary>
/// <param name="alertEvaluator">Production simple rule evaluation.</param>
/// <param name="metricSnapshotBuilder">Builds metrics for composite predicates.</param>
/// <param name="compositeEvaluator">Composite AND/OR evaluation.</param>
/// <param name="suppressionPolicy">Same policy as production (queries open alerts for dedupe).</param>
/// <param name="contextProvider">Builds <see cref="AlertEvaluationContext"/> per run.</param>
public sealed partial class RuleSimulationService(
    IAlertEvaluator alertEvaluator,
    IAlertMetricSnapshotBuilder metricSnapshotBuilder,
    ICompositeAlertRuleEvaluator compositeEvaluator,
    IAlertSuppressionPolicy suppressionPolicy,
    IAlertSimulationContextProvider contextProvider) : IRuleSimulationService
{
    private const string RuleKindSimple = RuleKindConstants.Simple;
    private const string RuleKindComposite = RuleKindConstants.Composite;

    private static AlertRule CloneSimpleForSimulation(AlertRule r) =>
        new()
        {
            RuleId = r.RuleId == Guid.Empty ? Guid.NewGuid() : r.RuleId,
            TenantId = r.TenantId,
            WorkspaceId = r.WorkspaceId,
            ProjectId = r.ProjectId,
            Name = r.Name,
            RuleType = r.RuleType,
            Severity = r.Severity,
            ThresholdValue = r.ThresholdValue,
            IsEnabled = true,
            TargetChannelType = r.TargetChannelType,
            MetadataJson = r.MetadataJson,
            CreatedUtc = r.CreatedUtc,
        };

    private static CompositeAlertRule CloneCompositeForSimulation(CompositeAlertRule r)
    {
        Guid id = r.CompositeRuleId == Guid.Empty ? Guid.NewGuid() : r.CompositeRuleId;
        return new CompositeAlertRule
        {
            CompositeRuleId = id,
            TenantId = r.TenantId,
            WorkspaceId = r.WorkspaceId,
            ProjectId = r.ProjectId,
            Name = r.Name,
            Severity = r.Severity,
            Operator = r.Operator,
            IsEnabled = true,
            SuppressionWindowMinutes = r.SuppressionWindowMinutes,
            CooldownMinutes = r.CooldownMinutes,
            ReopenDeltaThreshold = r.ReopenDeltaThreshold,
            DedupeScope = r.DedupeScope,
            TargetChannelType = r.TargetChannelType,
            CreatedUtc = r.CreatedUtc,
            Conditions = r.Conditions
                .Select(
                    c => new AlertRuleCondition
                    {
                        ConditionId = c.ConditionId == Guid.Empty ? Guid.NewGuid() : c.ConditionId,
                        MetricType = c.MetricType,
                        Operator = c.Operator,
                        ThresholdValue = c.ThresholdValue,
                    })
                .ToList(),
        };
    }
}
