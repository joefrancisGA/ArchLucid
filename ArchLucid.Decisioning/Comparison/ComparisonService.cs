using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Comparison;

/// <summary>
///     <see cref="IComparisonService" /> implementation: keyed merges over decisions, requirement coverage, security
///     controls, topology resources, and optional max monthly cost.
/// </summary>
/// <remarks>
///     Decision keys prefer <see cref="ResolvedArchitectureDecision.DecisionId" /> when set, else <c>Category::Title</c>.
///     Security controls key on <c>ControlId|ControlName</c> when <c>ControlId</c> is non-empty.
///     Requirement names are matched case-insensitively; several string comparisons for options/status use ordinal rules
///     as implemented per section.
/// </remarks>
public sealed partial class ComparisonService : IComparisonService
{
    /// <inheritdoc />
    public ComparisonResult Compare(ManifestDocument baseM, ManifestDocument targetM)
    {
        ArgumentNullException.ThrowIfNull(baseM);
        ArgumentNullException.ThrowIfNull(targetM);
        ComparisonResult result = new() { BaseRunId = baseM.RunId, TargetRunId = targetM.RunId };

        CompareDecisions(baseM, targetM, result);
        CompareRequirements(baseM, targetM, result);
        CompareSecurity(baseM, targetM, result);
        CompareTopology(baseM, targetM, result);
        CompareCost(baseM, targetM, result);
        BuildSummary(result);
        result.TotalDeltaCount =
            result.DecisionChanges.Count
            + result.RequirementChanges.Count
            + result.SecurityChanges.Count
            + result.TopologyChanges.Count
            + result.CostChanges.Count
            + result.DuplicateKeyConflicts.Count;

        return result;
    }

    private static string DecisionKey(ResolvedArchitectureDecision d)
    {
        return !string.IsNullOrWhiteSpace(d.DecisionId) ? d.DecisionId : $"{d.Category}::{d.Title}";
    }

    private static void BuildSummary(ComparisonResult r)
    {
        if (r.DecisionChanges.Count > 0)
            r.SummaryHighlights.Add($"{r.DecisionChanges.Count} decision change(s).");

        if (r.RequirementChanges.Count > 0)
            r.SummaryHighlights.Add($"{r.RequirementChanges.Count} requirement change(s).");

        if (r.SecurityChanges.Count > 0)
            r.SummaryHighlights.Add($"{r.SecurityChanges.Count} security posture delta(s).");

        if (r.TopologyChanges.Count > 0)
            r.SummaryHighlights.Add($"{r.TopologyChanges.Count} topology resource change(s).");

        if (r.CostChanges.Count > 0)
            r.SummaryHighlights.Add("Maximum monthly cost changed.");

        if (r.DuplicateKeyConflicts.Count > 0)
            r.SummaryHighlights.Add($"{r.DuplicateKeyConflicts.Count} duplicate comparison key conflict(s).");

        if (r.SummaryHighlights.Count == 0)
            r.SummaryHighlights.Add("No material differences detected in compared sections.");
    }

    private static Dictionary<string, ResolvedArchitectureDecision> BuildUniqueDecisionMap(
        IEnumerable<ResolvedArchitectureDecision> decisions,
        ComparisonResult result,
        string sectionLabel)
    {
        Dictionary<string, ResolvedArchitectureDecision> map = new(StringComparer.Ordinal);

        foreach (IGrouping<string, ResolvedArchitectureDecision> group in decisions.GroupBy(DecisionKey))
        {
            ResolvedArchitectureDecision[] values = group.ToArray();

            if (values.Length > 1)
            {
                result.DuplicateKeyConflicts.Add(new ComparisonDuplicateKeyConflict
                {
                    Section = sectionLabel,
                    Key = group.Key,
                    Count = values.Length,
                });

                continue;
            }

            map[group.Key] = values[0];
        }

        return map;
    }

    private static Dictionary<string, SecurityPostureItem> BuildUniqueSecurityMap(
        IEnumerable<SecurityPostureItem> controls,
        ComparisonResult result,
        string sectionLabel)
    {
        Dictionary<string, SecurityPostureItem> map = new(StringComparer.Ordinal);

        foreach (IGrouping<string, SecurityPostureItem> group in controls.GroupBy(SecurityControlKey))
        {
            SecurityPostureItem[] values = group.ToArray();

            if (values.Length > 1)
            {
                result.DuplicateKeyConflicts.Add(new ComparisonDuplicateKeyConflict
                {
                    Section = sectionLabel,
                    Key = group.Key,
                    Count = values.Length,
                });

                continue;
            }

            map[group.Key] = values[0];
        }

        return map;
    }

    private static string SecurityControlKey(SecurityPostureItem control) =>
        string.IsNullOrWhiteSpace(control.ControlId) ? control.ControlName : $"{control.ControlId}|{control.ControlName}";
}
