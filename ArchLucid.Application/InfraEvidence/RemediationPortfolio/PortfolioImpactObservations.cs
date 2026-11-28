namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

internal static class PortfolioImpactObservations
{
    internal static IReadOnlyDictionary<string, PortfolioExposureState> Evaluate(
        PortfolioImpactCapture capture, IReadOnlyDictionary<string, PortfolioControlState> controls, PortfolioImpactWork work,
        IReadOnlyDictionary<string, PortfolioExposureState>? previous = null, IReadOnlySet<string>? changed = null)
    {
        Dictionary<string, PortfolioExposureState> results = new(StringComparer.Ordinal);
        foreach (var observation in capture.Scenarios.SelectMany(scenario => scenario.Observations))
        {
            work.Spend();
            // Check every declared dependency, including conditions not reached when an earlier evaluation stopped.
            if (previous is not null && changed is not null)
            {
                work.Spend(observation.AllConditions.Count);
                if (!observation.AllConditions.Any(condition => changed.Contains(condition.ControlId)))
                {
                    results.Add(observation.ObservationId, previous[observation.ObservationId]);
                    continue;
                }
            }

            bool unknown = false;
            bool disproved = false;
            foreach (var condition in observation.AllConditions)
            {
                work.Spend();
                var found = controls[condition.ControlId];
                if (found == PortfolioControlState.Unknown)
                    unknown = true;
                else if (found != condition.RequiredState)
                {
                    disproved = true;
                    break;
                }
            }

            results.Add(observation.ObservationId, disproved
                ? PortfolioExposureState.AbsentWithinCoverage
                : unknown ? PortfolioExposureState.Unknown : PortfolioExposureState.Present);
        }
        return results;
    }

    /// <summary>Full reference calculation with no reuse or dependence on the incremental evaluator.</summary>
    internal static IReadOnlyDictionary<string, PortfolioExposureState> Full(
        PortfolioImpactCapture capture, IReadOnlyDictionary<string, PortfolioControlState> controls, PortfolioImpactWork work)
    {
        Dictionary<string, PortfolioExposureState> results = new(StringComparer.Ordinal);
        foreach (var scenario in capture.Scenarios)
        {
            foreach (var observation in scenario.Observations)
            {
                work.Spend(1 + observation.AllConditions.Count);
                int fulfilled = 0;
                int undetermined = 0;
                foreach (var condition in observation.AllConditions)
                {
                    if (controls[condition.ControlId] == condition.RequiredState)
                        fulfilled++;
                    else if (controls[condition.ControlId] == PortfolioControlState.Unknown)
                        undetermined++;
                }
                int count = observation.AllConditions.Count;
                results.Add(observation.ObservationId, fulfilled == count ? PortfolioExposureState.Present
                    : fulfilled + undetermined == count ? PortfolioExposureState.Unknown : PortfolioExposureState.AbsentWithinCoverage);
            }
        }
        return results;
    }

    internal static bool Agree(IReadOnlyDictionary<string, PortfolioExposureState> actual,
        IReadOnlyDictionary<string, PortfolioExposureState> reference) =>
        actual.Count == reference.Count
        && reference.All(pair => actual.TryGetValue(pair.Key, out var state) && state == pair.Value);

    internal static PortfolioScenarioImpact Describe(PortfolioExposureScenario scenario, bool captureComplete,
        IReadOnlyDictionary<string, PortfolioExposureState> baseline, IReadOnlyDictionary<string, PortfolioExposureState> proposed)
    {
        bool absenceCanBeReported = captureComplete && scenario.CoverageComplete && scenario.Observations.Count != 0;
        var observations = RemediationPortfolioGraph.Freeze(scenario.Observations.Select(item =>
        {
            var before = baseline[item.ObservationId];
            var after = proposed[item.ObservationId];
            return new PortfolioObservationImpact(item.ObservationId, item.EvidenceSha256, before, after,
                Delta(before, after));
        }));
        PortfolioExposureState ScenarioState(IEnumerable<PortfolioExposureState> states)
        {
            var values = states.ToArray();
            if (values.Contains(PortfolioExposureState.Present))
                return PortfolioExposureState.Present;
            return absenceCanBeReported && values.All(value => value == PortfolioExposureState.AbsentWithinCoverage)
                ? PortfolioExposureState.AbsentWithinCoverage : PortfolioExposureState.Unknown;
        }

        var from = ScenarioState(observations.Select(item => item.Baseline));
        var to = ScenarioState(observations.Select(item => item.Proposed));
        return new(scenario.ScenarioId, from, to, Delta(from, to), observations);
    }

    private static PortfolioExposureDelta Delta(PortfolioExposureState before, PortfolioExposureState after) => (before, after) switch
    {
        (PortfolioExposureState.Present, PortfolioExposureState.Present) => PortfolioExposureDelta.Remaining,
        (PortfolioExposureState.Present, PortfolioExposureState.AbsentWithinCoverage) => PortfolioExposureDelta.Removed,
        (PortfolioExposureState.AbsentWithinCoverage, PortfolioExposureState.Present) => PortfolioExposureDelta.Introduced,
        (PortfolioExposureState.AbsentWithinCoverage, PortfolioExposureState.AbsentWithinCoverage) =>
            PortfolioExposureDelta.AbsentInBothWithinCoverage,
        _ => PortfolioExposureDelta.Unknown,
    };
}

internal sealed class PortfolioImpactWork(TimeProvider clock, long start, PortfolioImpactLimits limits, CancellationToken token)
{
    internal int Used { get; private set; }

    internal void Spend(int amount = 1)
    {
        if (token.IsCancellationRequested)
            throw new PortfolioImpactStoppedException(PortfolioImpactStatus.Cancelled, "cancelled");
        if (clock.GetElapsedTime(start) >= limits.Timeout)
            throw new PortfolioImpactStoppedException(PortfolioImpactStatus.TimeLimit, "deadline_exhausted");
        if (amount > limits.MaxWork - Used)
            throw new PortfolioImpactStoppedException(PortfolioImpactStatus.WorkLimit, "work_limit_exhausted");
        Used += amount;
    }
}

internal sealed class PortfolioImpactStoppedException(PortfolioImpactStatus status, string reason) : Exception(reason)
{
    internal PortfolioImpactStatus Status { get; } = status;
}
