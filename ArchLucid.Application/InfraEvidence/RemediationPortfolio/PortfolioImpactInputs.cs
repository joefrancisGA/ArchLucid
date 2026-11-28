using ArchLucid.Application.Analysis;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

internal static class PortfolioImpactInputs
{
    internal const int MaxWork = 220_000;
    private const int MaxControls = 256;
    private const int MaxScenarios = 1_024;
    private const int MaxObservations = 1_024;
    private const int MaxConditions = 16;
    private const int MaxChanges = 16;

    internal static PortfolioImpactCapture? FreezeCapture(PortfolioImpactCapture capture)
    {
        if (!Token(capture.ObservationModelVersion))
            return null;
        var controls = Rows(capture.Controls, MaxControls);
        var scenarios = Rows(capture.Scenarios, MaxScenarios);
        if (controls is null || scenarios is null
            || controls.Any(row => row is null || !Token(row.ControlId) || !Enum.IsDefined(row.State))
            || !Unique(controls.Select(row => row.ControlId)))
            return null;

        var keys = controls.Select(row => row.ControlId).ToHashSet(StringComparer.Ordinal);
        var allObservationIds = new HashSet<string>(StringComparer.Ordinal);
        List<PortfolioExposureScenario> frozen = [];
        foreach (var scenario in scenarios)
        {
            if (scenario is null || !Token(scenario.ScenarioId))
                return null;
            var observations = Rows(scenario.Observations, MaxObservations);
            if (observations is null || allObservationIds.Count + observations.Length > MaxObservations)
                return null;
            List<PortfolioExposureObservation> variants = [];
            foreach (var observation in observations)
            {
                if (observation is null || !Token(observation.ObservationId) || !allObservationIds.Add(observation.ObservationId)
                    || !Hash(observation.EvidenceSha256))
                    return null;
                var conditions = Rows(observation.AllConditions, MaxConditions);
                if (conditions is null || conditions.Length == 0
                    || conditions.Any(row => row is null || !keys.Contains(row.ControlId) || !Known(row.RequiredState))
                    || !Unique(conditions.Select(row => row.ControlId)))
                    return null;
                variants.Add(observation with { EvidenceSha256 = observation.EvidenceSha256.ToUpperInvariant(),
                    AllConditions = Order(conditions, row => row.ControlId) });
            }

            frozen.Add(scenario with { Observations = Order(variants, row => row.ObservationId) });
        }

        return !Unique(frozen.Select(row => row.ScenarioId)) ? null : capture with
        {
            Controls = Order(controls, row => row.ControlId),
            Scenarios = Order(frozen, row => row.ScenarioId),
        };
    }

    internal static PortfolioImpactPlan? FreezePlan(PortfolioImpactPlan plan)
    {
        if (plan.OptimizerInputSha256 is { } optimizerPin && !Hash(optimizerPin))
            return null;
        var selected = Rows(plan.SelectedActionIds, RemediationPortfolioGraphBuilder.MaxActions);
        var effects = Rows(plan.Effects, RemediationPortfolioGraphBuilder.MaxActions);
        if (selected is null || effects is null || selected.Any(id => !Token(id)) || !Unique(selected))
            return null;
        List<PortfolioModeledEffect> frozen = [];
        foreach (var effect in effects)
        {
            if (effect is null || !Token(effect.ActionId) || !Hash(effect.EvidenceSha256))
                return null;
            var changes = Rows(effect.Changes, MaxChanges);
            if (changes is null || changes.Any(row => row is null || !Token(row.ControlId) || !Known(row.ExpectedState)
                    || !Known(row.ProposedState) || row.ExpectedState == row.ProposedState)
                || !Unique(changes.Select(row => row.ControlId)))
                return null;
            frozen.Add(effect with { EvidenceSha256 = effect.EvidenceSha256.ToUpperInvariant(),
                Changes = Order(changes, row => row.ControlId) });
        }

        return !Unique(frozen.Select(row => row.ActionId)) ? null : plan with
        {
            SelectedActionIds = Order(selected, id => id),
            Effects = Order(frozen, row => row.ActionId),
            OptimizerInputSha256 = plan.OptimizerInputSha256?.ToUpperInvariant(),
        };
    }

    internal static string Digest<T>(string kind, T value) =>
        AnalysisDependencyFingerprint.Digest(new { Version = RemediationPortfolioImpactEvaluator.Version, Kind = kind, Value = value });

    internal static bool Hash(string? value) => value is { Length: 64 } && value.All(Uri.IsHexDigit);

    private static bool Known(PortfolioControlState value) => value is PortfolioControlState.Enforced or PortfolioControlState.NotEnforced;

    private static bool Token(string? value) => value is { Length: > 0 and <= 192 } && !string.IsNullOrWhiteSpace(value)
        && string.Equals(value, value.Trim(), StringComparison.Ordinal) && !value.Any(char.IsControl);

    private static bool Unique(IEnumerable<string> values)
    {
        HashSet<string> keys = new(StringComparer.Ordinal);
        return values.All(keys.Add);
    }

    private static T[]? Rows<T>(IReadOnlyList<T>? rows, int max)
    {
        if (rows is null || rows.Count > max)
            return null;
        var bounded = rows.Take(max + 1).ToArray();
        return bounded.Length <= max ? bounded : null;
    }

    private static IReadOnlyList<T> Order<T>(IEnumerable<T> rows, Func<T, string> key) =>
        RemediationPortfolioGraph.Freeze(rows.OrderBy(key, StringComparer.Ordinal));
}
