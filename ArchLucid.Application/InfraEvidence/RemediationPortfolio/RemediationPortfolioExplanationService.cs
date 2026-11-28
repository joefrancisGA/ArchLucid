using ArchLucid.Application.Analysis;

using static ArchLucid.Application.InfraEvidence.RemediationPortfolio.RemediationPortfolioGraph;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

/// <summary>Explains the canonical planner output for authorized, already pinned advisory inputs.</summary>
public sealed class RemediationPortfolioExplanationService(TimeProvider clock)
{
    public const int MaxDetailedAlternatives = 8;
    public const int MaxSensitivityCases = 4;
    private static TimeSpan MaxCombinedSolverTimeout => TimeSpan.FromSeconds(20);
    private readonly BoundedRemediationPortfolioOptimizer optimizer = new(clock);

    public PortfolioExplanation.Result Build(PortfolioOptimizationPin authorizedPin, RemediationPortfolioGraph graph,
        PortfolioExplanation.Request request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(authorizedPin);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(request);

        if (request.Planning is not { Planning: { } planning, MaxAlternatives: >= 1 and <= MaxDetailedAlternatives }
            || authorizedPin != new PortfolioOptimizationPin(graph.Binding, graph.GraphSha256)
            || planning.Pin != authorizedPin || planning.TopN?.Pin != authorizedPin)
            return Invalid("invalid_request_or_scope_pin");

        if (cancellationToken.IsCancellationRequested)
            return Empty(PortfolioExplanation.Status.Cancelled, "cancelled_before_input_validation");

        var input = PortfolioOptimizationInput.Snapshot(graph, planning);

        if (input is null || !TryNormalize(graph, input, request, out var critical, out var variants))
            return Invalid("invalid_planning_or_sensitivity_input");

        var baseline = optimizer.OptimizeAlternatives(authorizedPin, graph, new(input, request.Planning.MaxAlternatives), cancellationToken);
        string inputSha256 = AnalysisDependencyFingerprint.Digest(new
        {
            Version = PortfolioExplanation.SchemaVersion,
            Baseline = PortfolioOptimizationInput.Digest(input, baseline.SolverVersion),
            request.Planning.MaxAlternatives,
            CriticalScenarioIds = critical.Order(StringComparer.Ordinal).ToArray(),
            SensitivityCases = variants.Select(row => row.Assumptions).ToArray(),
        });
        List<PortfolioExplanation.Plan> plans = [];
        List<PortfolioExplanation.Sensitivity> changes = [];
        bool cancelled = baseline.Outcome == PortfolioPareto.Status.Cancelled || cancellationToken.IsCancellationRequested;

        try
        {
            if (!cancelled && baseline.Alternatives.Count > 0)
            {
                var context = new PortfolioPlanExplanation(graph, input, critical);

                foreach (var alternative in baseline.Alternatives)
                    plans.Add(context.Explain(alternative, cancellationToken));
            }

            // A looser approved budget can make an infeasible baseline feasible.
            // An unavailable graph or invalid evidence must never be retried as a what-if.

            if (!cancelled && baseline.Outcome is not (PortfolioPareto.Status.InvalidInput or PortfolioPareto.Status.GraphUnavailable))
            {
                var weights = input.ScenarioWeights.ToDictionary(row => row.ScenarioId, row => row.Points, StringComparer.Ordinal);

                foreach (var item in variants)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var variant = optimizer.OptimizeAlternatives(authorizedPin, graph, new(item.Input, 1), cancellationToken);
                    var first = variant.Alternatives.FirstOrDefault();
                    changes.Add(new(item.Assumptions, item.Input.Limits, item.Input.ObjectiveVersion, Snapshot(variant),
                        first, Difference(baseline.Alternatives.FirstOrDefault(), first, weights)));

                    if (variant.Outcome == PortfolioPareto.Status.Cancelled)
                    {
                        cancelled = true;
                        break;
                    }
                }
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            cancelled = true;
        }

        cancelled |= cancellationToken.IsCancellationRequested;
        var notRun = variants.Skip(changes.Count).Select(row => row.Assumptions.Id);
        return new(PortfolioExplanation.SchemaVersion, cancelled ? PortfolioExplanation.Status.Cancelled : PortfolioExplanation.Status.Built,
            authorizedPin, graph.Version, input.ObjectiveVersion, input.ConstraintVersion, input.TopN.RankingVersion, inputSha256, input.Limits, input.Search,
            Snapshot(baseline), Freeze(plans), Freeze(changes), Freeze(notRun), cancelled ? "cancelled" : null);
    }

    private static bool TryNormalize(RemediationPortfolioGraph graph, PortfolioOptimizationRequest input, PortfolioExplanation.Request request,
        out HashSet<string> critical, out List<Variant> variants)
    {
        critical = new(StringComparer.Ordinal);
        variants = [];

        if (request.CriticalScenarioIds is not { } criticalIds || criticalIds.Count > graph.Scenarios.Count
            || request.ApprovedSensitivityCases is not { Count: <= MaxSensitivityCases } approved
            || input.Search.Timeout.Ticks * (1 + approved.Count) > MaxCombinedSolverTimeout.Ticks)
            return false;

        var scenarioIds = graph.Scenarios.Select(row => row.Id).ToHashSet(StringComparer.Ordinal);

        foreach (string id in criticalIds)
        {
            if (!scenarioIds.Contains(id) || !critical.Add(id))
                return false;
        }

        var baseWeights = input.ScenarioWeights.ToDictionary(row => row.ScenarioId, row => row.Points, StringComparer.Ordinal);
        HashSet<string> ids = new(StringComparer.Ordinal);

        foreach (var item in approved)
        {
            if (item is null || !ValidToken(item.Id) || !ValidToken(item.ApprovalBasisId) || !ids.Add(item.Id)
                || item.WeightOverrides is not { } overrides || overrides.Count > baseWeights.Count
                || (item.CostLimit is null && overrides.Count == 0)
                || (overrides.Count == 0 && item.ObjectiveVersion is not null)
                || (overrides.Count > 0 && (!ValidToken(item.ObjectiveVersion) || item.ObjectiveVersion == input.ObjectiveVersion)))
                return false;

            var weightSnapshot = overrides.ToArray();
            Dictionary<string, long> weightChanges = new(StringComparer.Ordinal);

            if (!weightSnapshot.All(row => row is not null && scenarioIds.Contains(row.ScenarioId)
                    && baseWeights.ContainsKey(row.ScenarioId) && weightChanges.TryAdd(row.ScenarioId, row.Points)))
                return false;

            var variant = PortfolioOptimizationInput.Snapshot(graph, input with
            {
                ObjectiveVersion = item.ObjectiveVersion ?? input.ObjectiveVersion,
                Limits = input.Limits with { Cost = item.CostLimit ?? input.Limits.Cost },
                ScenarioWeights = Freeze(input.ScenarioWeights.Select(row => row with
                {
                    Points = weightChanges.GetValueOrDefault(row.ScenarioId, row.Points),
                })),
            });

            if (variant is null)
                return false;

            var assumptions = item with { WeightOverrides = Freeze(weightSnapshot.OrderBy(row => row.ScenarioId, StringComparer.Ordinal)) };
            variants.Add(new(assumptions, variant));
        }

        variants.Sort((a, b) => StringComparer.Ordinal.Compare(a.Assumptions.Id, b.Assumptions.Id));
        return true;
    }

    private static PortfolioExplanation.Change? Difference(PortfolioPareto.Alternative? baseline, PortfolioPareto.Alternative? variant,
        IReadOnlyDictionary<string, long> originalWeights)
    {
        if (baseline is null || variant is null)
            return null;

        var a = baseline.Plan;
        var b = variant.Plan;
        long originalScale = b.CoveredScenarioIds.Sum(id => originalWeights[id]);
        return new(Except(b.SelectedActionIds, a.SelectedActionIds), Except(a.SelectedActionIds, b.SelectedActionIds),
            Except(b.CoveredScenarioIds, a.CoveredScenarioIds), Except(a.CoveredScenarioIds, b.CoveredScenarioIds),
            originalScale, originalScale - a.ModeledCoveragePoints, b.Usage.Cost - a.Usage.Cost,
            b.Usage.Disruption - a.Usage.Disruption,
            Freeze(b.Usage.Staff.Zip(a.Usage.Staff).Select(pair => pair.First with { Minutes = pair.First.Minutes - pair.Second.Minutes })));
    }

    private static IReadOnlyList<string> Except(IEnumerable<string> a, IEnumerable<string> b) =>
        Freeze(a.Except(b, StringComparer.Ordinal).Order(StringComparer.Ordinal));

    private static bool ValidToken(string? value) => value is { Length: > 0 and <= 128 } && !string.IsNullOrWhiteSpace(value)
        && string.Equals(value, value.Trim(), StringComparison.Ordinal) && !value.Any(char.IsControl);

    private static PortfolioExplanation.Frontier Snapshot(PortfolioPareto.Result result) =>
        new(result.SolverVersion, result.Outcome, result.InputSha256, result.EvaluatedSearchNodes,
            result.RetainedAlternatives, result.OutputTruncated, result.Issues);

    private static PortfolioExplanation.Result Invalid(string reason) => Empty(PortfolioExplanation.Status.InvalidInput, reason);

    private static PortfolioExplanation.Result Empty(PortfolioExplanation.Status status, string detail) =>
        new(PortfolioExplanation.SchemaVersion, status, null, null, null, null, null, null, null, null, null, [], [], [], detail);

    private sealed record Variant(PortfolioExplanation.ApprovedSensitivityCase Assumptions, PortfolioOptimizationRequest Input);
}
