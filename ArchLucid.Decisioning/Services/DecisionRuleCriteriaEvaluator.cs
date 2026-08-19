using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Evaluates <see cref="DecisionRule.Criteria" /> against finding context without changing rule outcomes
///     unless criteria are configured on the rule.
/// </summary>
internal static class DecisionRuleCriteriaEvaluator
{
    internal static bool TryEvaluate(
        Finding finding,
        IReadOnlyDictionary<string, string> criteria,
        out IReadOnlyList<string> missingContextFieldPaths)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (criteria.Count == 0)
        {
            missingContextFieldPaths = [];
            return true;
        }

        List<string> missing = [];

        foreach (KeyValuePair<string, string> entry in criteria)
        {
            if (!DecisionRuleContextFieldResolver.TryResolve(finding, entry.Key, out string? actual)
                || string.IsNullOrWhiteSpace(actual))
            {
                missing.Add(entry.Key);
                continue;
            }

            if (!string.IsNullOrWhiteSpace(entry.Value)
                && !string.Equals(actual, entry.Value, StringComparison.OrdinalIgnoreCase))
                return Fail(missing, out missingContextFieldPaths);
        }

        if (missing.Count > 0)
            return Fail(missing, out missingContextFieldPaths);

        missingContextFieldPaths = [];
        return true;
    }

    private static bool Fail(List<string> missing, out IReadOnlyList<string> missingContextFieldPaths)
    {
        missingContextFieldPaths = missing;
        return false;
    }
}
