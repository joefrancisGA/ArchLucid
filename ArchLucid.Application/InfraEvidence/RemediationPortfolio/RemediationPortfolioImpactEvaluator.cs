namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

/// <summary>Offline defensive model verification over authorized artifacts. No path discovery, providers or execution hooks.</summary>
public sealed class RemediationPortfolioImpactEvaluator(TimeProvider timeProvider)
{
    public const string Version = "FND090-offline-portfolio-impact-v1";
    private readonly TimeProvider clock = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <summary>Canonical content identity, not evidence that the capture has been independently reviewed.</summary>
    public static string CaptureSha256(PortfolioImpactCapture capture) => PortfolioImpactInputs.Digest("capture",
        PortfolioImpactInputs.FreezeCapture(capture) ?? throw new ArgumentException("Invalid capture.", nameof(capture)));

    /// <summary>Canonical content identity, not evidence that the plan or its modeled effects have been reviewed.</summary>
    public static string PlanSha256(PortfolioImpactPlan plan) => PortfolioImpactInputs.Digest("plan",
        PortfolioImpactInputs.FreezePlan(plan) ?? throw new ArgumentException("Invalid plan.", nameof(plan)));

    public PortfolioImpactResult Evaluate(PortfolioImpactPin authorizedPin, RemediationPortfolioGraph graph,
        PortfolioImpactCapture capture, PortfolioImpactPlan plan, PortfolioImpactLimits limits,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(authorizedPin);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(capture);
        ArgumentNullException.ThrowIfNull(plan);
        ArgumentNullException.ThrowIfNull(limits);

        long started = clock.GetTimestamp();
        if (authorizedPin.Portfolio != new PortfolioOptimizationPin(graph.Binding, graph.GraphSha256)
            || capture.Portfolio != authorizedPin.Portfolio || plan.Portfolio != authorizedPin.Portfolio
            || !PortfolioImpactInputs.Hash(authorizedPin.CaptureSha256) || !PortfolioImpactInputs.Hash(authorizedPin.PlanSha256))
            return Failed(PortfolioImpactStatus.InvalidInput, "pin", "scope_or_graph_pin_mismatch");
        if (limits.MaxWork is < 1 or > PortfolioImpactInputs.MaxWork || limits.Timeout <= TimeSpan.Zero
            || limits.Timeout > TimeSpan.FromSeconds(10))
            return Failed(PortfolioImpactStatus.InvalidInput, "limits", "invalid_work_or_time_limit");

        var work = new PortfolioImpactWork(clock, started, limits, cancellationToken);
        string? baselineHash = null;
        string? planHash = null;
        try
        {
            work.Spend(0);
            var source = PortfolioImpactInputs.FreezeCapture(capture);
            var changes = PortfolioImpactInputs.FreezePlan(plan);
            if (source is null || changes is null)
                return Failed(PortfolioImpactStatus.InvalidInput, "input", "invalid_capture_or_plan");

            string actualCaptureHash = PortfolioImpactInputs.Digest("capture", source);
            string actualPlanHash = PortfolioImpactInputs.Digest("plan", changes);
            if (!string.Equals(actualCaptureHash, authorizedPin.CaptureSha256, StringComparison.OrdinalIgnoreCase)
                || !string.Equals(actualPlanHash, authorizedPin.PlanSha256, StringComparison.OrdinalIgnoreCase))
                return Failed(PortfolioImpactStatus.StaleInput, "pin", "capture_or_reviewed_change_digest_mismatch");

            baselineHash = actualCaptureHash;
            planHash = actualPlanHash;
            work.Spend();
            if (!graph.CanEvaluateSelections)
                return Failed(PortfolioImpactStatus.IncompleteCoverage, "graph", "dependency_or_snapshot_coverage_incomplete",
                    baselineHash, planHash, work.Used);
            var selection = graph.EvaluateSelection(changes.SelectedActionIds);
            if (!selection.Feasible)
                return Failed(PortfolioImpactStatus.InfeasiblePlan, "selection", "graph_rejected_selected_actions",
                    baselineHash, planHash, work.Used, selection.Issues);

            var selected = changes.SelectedActionIds.ToHashSet(StringComparer.Ordinal);
            if (!selected.SetEquals(changes.Effects.Select(effect => effect.ActionId)) || changes.Effects.Any(effect => effect.Changes.Count == 0))
                return Failed(PortfolioImpactStatus.UnsupportedEffect, "plan", "selected_action_lacks_a_reviewed_effect_or_plan_has_extra_effect",
                    baselineHash, planHash, work.Used);

            var original = source.Controls.ToDictionary(row => row.ControlId, row => row.State, StringComparer.Ordinal);
            Dictionary<string, PortfolioControlState> patched = new(original, StringComparer.Ordinal);
            HashSet<string> changed = new(StringComparer.Ordinal);
            foreach (var effect in changes.Effects)
            {
                foreach (var change in effect.Changes)
                {
                    work.Spend();
                    if (!original.TryGetValue(change.ControlId, out var before) || !changed.Add(change.ControlId))
                        return Failed(PortfolioImpactStatus.UnsupportedEffect, change.ControlId, "undeclared_control_or_ambiguous_multiwriter_effect",
                            baselineHash, planHash, work.Used);
                    if (before != change.ExpectedState)
                        return Failed(before == PortfolioControlState.Unknown ? PortfolioImpactStatus.IncompleteCoverage : PortfolioImpactStatus.StaleInput,
                            change.ControlId, "modeled_control_precondition_unestablished", baselineHash, planHash, work.Used);
                    patched[change.ControlId] = change.ProposedState;
                }
            }

            var proposed = source with { Controls = RemediationPortfolioGraph.Freeze(source.Controls
                .Select(row => new PortfolioModeledControl(row.ControlId, patched[row.ControlId]))) };
            string proposedHash = PortfolioImpactInputs.Digest("capture", proposed);
            var baseline = PortfolioImpactObservations.Evaluate(source, original, work);
            var incremental = PortfolioImpactObservations.Evaluate(proposed, patched, work, baseline, changed);
            var fullBaseline = PortfolioImpactObservations.Full(source, original, work);
            var fullProposed = PortfolioImpactObservations.Full(proposed, patched, work);
            work.Spend(0);
            return Reconcile(graph, source, baselineHash, proposedHash, planHash, baseline, incremental, fullBaseline, fullProposed, work);
        }
        catch (PortfolioImpactStoppedException stopped)
        {
            return Failed(stopped.Status, "simulation", stopped.Message, baselineHash, planHash, work.Used);
        }
    }

    internal static PortfolioImpactResult Reconcile(RemediationPortfolioGraph graph, PortfolioImpactCapture source, string baselineHash,
        string proposedHash, string planHash, IReadOnlyDictionary<string, PortfolioExposureState> baseline,
        IReadOnlyDictionary<string, PortfolioExposureState> proposed, IReadOnlyDictionary<string, PortfolioExposureState> fullBaseline,
        IReadOnlyDictionary<string, PortfolioExposureState> fullProposed, PortfolioImpactWork work)
    {
        work.Spend(baseline.Count + proposed.Count);
        if (!PortfolioImpactObservations.Agree(baseline, fullBaseline) || !PortfolioImpactObservations.Agree(proposed, fullProposed))
            return Failed(PortfolioImpactStatus.VerificationMismatch, "verification", "incremental_and_independent_full_observations_disagree",
                baselineHash, planHash, work.Used);

        var roster = source.Scenarios.ToDictionary(row => row.ScenarioId, StringComparer.Ordinal);
        List<PortfolioIssue> issues = [];
        List<PortfolioScenarioImpact> results = [];
        if (!source.CoverageComplete)
            issues.Add(new("capture", "capture_observation_coverage_incomplete"));

        foreach (string id in roster.Keys.Concat(graph.Scenarios.Select(row => row.Id)).Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal))
        {
            work.Spend();
            if (!roster.TryGetValue(id, out var scenario))
            {
                issues.Add(new(id, "scenario_missing_from_reviewed_observation_roster"));
                results.Add(new(id, PortfolioExposureState.Unknown, PortfolioExposureState.Unknown, PortfolioExposureDelta.Unknown, []));
                continue;
            }

            work.Spend(scenario.Observations.Count);
            var impact = PortfolioImpactObservations.Describe(scenario, source.CoverageComplete, baseline, proposed);
            if (!scenario.CoverageComplete || impact.Delta == PortfolioExposureDelta.Unknown ||
                impact.Observations.Any(row => row.Delta == PortfolioExposureDelta.Unknown))
                issues.Add(new(id, "insufficient_scenario_observation_coverage"));
            results.Add(impact);
        }

        work.Spend(0);
        return new(Version, issues.Count == 0 ? PortfolioImpactStatus.Modeled : PortfolioImpactStatus.IncompleteCoverage,
            baselineHash, proposedHash, planHash, true, RemediationPortfolioGraph.Freeze(results),
            RemediationPortfolioGraph.SortIssues(issues), work.Used);
    }

    private static PortfolioImpactResult Failed(PortfolioImpactStatus status, string subject, string reason,
        string? baseline = null, string? plan = null, int work = 0, IReadOnlyList<PortfolioIssue>? issues = null) =>
        new(Version, status, baseline, null, plan, false, [],
            RemediationPortfolioGraph.SortIssues((issues ?? []).Append(new(subject, reason))), work);
}
