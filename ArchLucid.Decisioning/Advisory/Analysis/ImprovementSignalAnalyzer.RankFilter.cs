using ArchLucid.Core.Comparison;
using ArchLucid.Decisioning.Advisory.Models;

namespace ArchLucid.Decisioning.Advisory.Analysis;

public sealed partial class ImprovementSignalAnalyzer
{
    private static void RankAndFilterComparisonSignals(ComparisonResult comparison, List<ImprovementSignal> signals)
    {
        foreach (SecurityDelta delta in comparison.SecurityChanges)

            if (SecurityDeltaRegressionClassifier.IsRegression(delta))

                signals.Add(new ImprovementSignal
                {
                    SignalType = ImprovementSignalTypes.SecurityRegression,
                    Category = ImprovementSignalCategories.Security,
                    Title = $"Security posture changed: {delta.ControlName}",
                    Description = $"{delta.BaseStatus ?? "—"} → {delta.TargetStatus ?? "—"}",
                    Severity = ImprovementSignalSeverities.High
                });

        foreach (CostDelta delta in comparison.CostChanges)

            if (delta is { BaseCost: not null, TargetCost: not null } && delta.TargetCost > delta.BaseCost)

                signals.Add(new ImprovementSignal
                {
                    SignalType = ImprovementSignalTypes.CostIncrease,
                    Category = ImprovementSignalCategories.Cost,
                    Title = "Estimated cost increased",
                    Description = $"{delta.BaseCost:0.00} → {delta.TargetCost:0.00}",
                    Severity = ImprovementSignalSeverities.Medium
                });

        foreach (DecisionDelta d in comparison.DecisionChanges)

            if (string.Equals(d.ChangeType, ChangeTypeRemoved, StringComparison.OrdinalIgnoreCase))

                signals.Add(new ImprovementSignal
                {
                    SignalType = ImprovementSignalTypes.DecisionRemoved,
                    Category = ImprovementSignalCategories.Requirement,
                    Title = $"Decision removed: {d.DecisionKey}",
                    Description = $"Previously: {d.BaseValue ?? "—"}",
                    Severity = ImprovementSignalSeverities.Medium
                });
    }
}
