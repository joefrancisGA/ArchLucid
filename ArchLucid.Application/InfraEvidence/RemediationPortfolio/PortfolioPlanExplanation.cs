using static ArchLucid.Application.InfraEvidence.RemediationPortfolio.PortfolioOptimizationModel;
using static ArchLucid.Application.InfraEvidence.RemediationPortfolio.RemediationPortfolioGraph;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

/// <summary>Explains canonical validated alternatives without changing selection or scoring rules.</summary>
internal sealed class PortfolioPlanExplanation(RemediationPortfolioGraph graph, PortfolioOptimizationRequest input,
    IReadOnlySet<string> critical)
{
    private readonly PortfolioOptimizationModel model = new(graph, input);
    private readonly IReadOnlyDictionary<string, long> weights = input.ScenarioWeights
        .ToDictionary(row => row.ScenarioId, row => row.Points, StringComparer.Ordinal);
    private readonly IReadOnlyDictionary<string, PortfolioActionEstimate> estimates = input.Estimates
        .ToDictionary(row => row.ActionId, StringComparer.Ordinal);
    private readonly IReadOnlyDictionary<string, int> indices = graph.Actions.Select((row, i) => (row.Id, Index: i))
        .ToDictionary(row => row.Id, row => row.Index, StringComparer.Ordinal);

    private readonly IReadOnlyDictionary<Guid, int> ranks = input.TopN.OrderedFindingIds
        .Select((id, position) => (id, Rank: position + 1)).ToDictionary(row => row.id, row => row.Rank);

    internal PortfolioExplanation.Plan Explain(PortfolioPareto.Alternative alternative, CancellationToken token)
    {
        var plan = alternative.Plan;
        var covered = plan.CoveredScenarioIds.ToHashSet(StringComparer.Ordinal);
        var unknown = plan.UnknownScenarioIds.ToHashSet(StringComparer.Ordinal);
        var scenarios = Freeze(graph.Scenarios.Select(row => new PortfolioExplanation.Scenario(row.Id, row.CauseId,
            critical.Contains(row.Id), covered.Contains(row.Id) ? PortfolioExplanation.ScenarioState.ModeledCovered
                : unknown.Contains(row.Id) ? PortfolioExplanation.ScenarioState.Unknown : PortfolioExplanation.ScenarioState.ModeledUncovered,
            weights.TryGetValue(row.Id, out long weight) ? weight : null,
            covered.Contains(row.Id) ? weight : 0, row.Evidence)));
        UInt128 chosen = plan.SelectedActionIds.Aggregate(UInt128.Zero, (mask, id) => mask | Bit(indices[id]));
        List<PortfolioExplanation.SelectedAction> selected = [];
        List<PortfolioExplanation.ExcludedAction> excluded = [];

        for (int i = 0; i < graph.Actions.Count; i++)
        {
            token.ThrowIfCancellationRequested();
            UInt128 bit = Bit(i);
            var action = graph.Actions[i];

            if (Contains(chosen, bit))
                selected.Add(Selected(action, chosen, bit, plan.ModeledCoveragePoints, covered));
            else
                excluded.Add(Excluded(action, chosen, bit, plan.ModeledCoveragePoints));
        }

        return new(alternative, scenarios, Freeze(selected), Freeze(excluded));
    }

    private PortfolioExplanation.SelectedAction Selected(PortfolioActionNode action, UInt128 chosen, UInt128 bit,
        long originalScore, IReadOnlySet<string> covered)
    {
        UInt128 removed = 0;

        for (UInt128 remaining = chosen; remaining != 0; remaining &= remaining - 1)
        {
            UInt128 member = Bit(Index(remaining));

            if (Contains(model.Closure(member), bit))
                removed |= member;
        }

        var coveredCauses = graph.Coverage.Where(row => covered.Contains(row.ScenarioId)
                && row.AllActionIds.Any(id => Contains(model.Closure(Bit(indices[id])), bit))
                && row.AllActionIds.All(id => Contains(chosen, Bit(indices[id]))))
            .Select(row => row.ScenarioId).ToHashSet(StringComparer.Ordinal);
        var causes = graph.Scenarios.Where(row => coveredCauses.Contains(row.Id))
            .Select(row => row.CauseId).Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal);
        return new(action.Id, action.ActionKind, input.MandatoryActionIds.Contains(action.Id, StringComparer.Ordinal),
            (model.Mandatory & removed) != 0, Ids(model.Closure(bit) & ~bit), Freeze(causes), Findings(action), action.Evidence,
            estimates[action.Id], Ids(removed), originalScore - model.Score(chosen & ~removed));
    }

    private PortfolioExplanation.ExcludedAction Excluded(PortfolioActionNode action, UInt128 chosen, UInt128 bit, long originalScore)
    {
        UInt128 closure = model.Closure(bit);
        UInt128 augmented = chosen | closure;
        var unavailable = Ids(closure & ~model.Available);
        List<PortfolioExplanation.AddBlocker> blockers = [];
        var conflicts = Freeze(graph.Relationships.Where(edge => edge.Relationship == PortfolioRelationship.Conflicts
            && Contains(augmented, Bit(indices[edge.FirstActionId]) | Bit(indices[edge.SecondActionId]))));
        IReadOnlyList<PortfolioPareto.BindingConstraint> exceeded = [];

        if (!Contains(model.EvidenceAvailable, closure))
            blockers.Add(PortfolioExplanation.AddBlocker.EvidenceUnavailable);

        if (unavailable.Any(id => !HasKnownEstimate(estimates.GetValueOrDefault(id))))
            blockers.Add(PortfolioExplanation.AddBlocker.EstimateUnavailable);

        if (conflicts.Count > 0)
            blockers.Add(PortfolioExplanation.AddBlocker.Conflict);

        // No zero-cost placeholders are interpreted as valid resource estimates.

        if (unavailable.Count == 0)
        {
            exceeded = Exceeded(model.ResourceUsage(augmented), input.Limits);

            foreach (var kind in exceeded.Select(row => row.Kind).Distinct())
                blockers.Add(ToBlocker(kind));
        }

        long? additional = blockers.Count == 0 && model.IsFeasible(augmented) ? model.Score(augmented) - originalScore : null;
        var finding = additional switch
        {
            null => PortfolioExplanation.AddFinding.Blocked,
            0 => PortfolioExplanation.AddFinding.NoAdditionalModeledPoints,
            _ => PortfolioExplanation.AddFinding.FeasibleAddNotSelected,
        };
        var related = Ids(closure).ToHashSet(StringComparer.Ordinal);
        return new(action.Id, action.ActionKind, estimates.GetValueOrDefault(action.Id), Ids(closure & ~bit), unavailable, Findings(action), conflicts, exceeded,
            Freeze(blockers), finding, additional, Freeze(model.Issues.Where(issue => related.Contains(issue.SubjectId))));
    }

    private IReadOnlyList<PortfolioExplanation.FindingLink> Findings(PortfolioActionNode action) =>
        Freeze(action.FindingIds.Distinct().Select(id => new PortfolioExplanation.FindingLink(id,
                ranks.TryGetValue(id, out int rank) ? rank : null))
            .OrderBy(row => row.CapturedRank ?? int.MaxValue).ThenBy(row => row.FindingId));

    private static bool HasKnownEstimate(PortfolioActionEstimate? estimate) =>
        estimate is { Cost.Units: not null, Disruption.Units: not null, Staff: not null };

    private IReadOnlyList<string> Ids(UInt128 mask)
    {
        List<string> ids = [];
        for (UInt128 bits = mask; bits != 0; bits &= bits - 1)
            ids.Add(graph.Actions[Index(bits)].Id);
        return Freeze(ids);
    }

    private static IReadOnlyList<PortfolioPareto.BindingConstraint> Exceeded(PortfolioResourceUsage usage, PortfolioResourceLimits limits)
    {
        List<PortfolioPareto.BindingConstraint> result = [];

        if (usage.Cost > limits.Cost)
            result.Add(new(PortfolioPareto.ConstraintKind.Cost, null, limits.Cost));

        if (usage.Disruption > limits.Disruption)
            result.Add(new(PortfolioPareto.ConstraintKind.Disruption, null, limits.Disruption));

        foreach (var (used, capacity) in usage.Staff.Zip(limits.Staff))
        {
            if (used.Minutes > capacity.Minutes)
                result.Add(new(PortfolioPareto.ConstraintKind.Staffing, capacity.TeamKey, capacity.Minutes));
        }

        return Freeze(result);
    }

    private static PortfolioExplanation.AddBlocker ToBlocker(PortfolioPareto.ConstraintKind kind) => kind switch
    {
        PortfolioPareto.ConstraintKind.Cost => PortfolioExplanation.AddBlocker.Cost,
        PortfolioPareto.ConstraintKind.Disruption => PortfolioExplanation.AddBlocker.Disruption,
        PortfolioPareto.ConstraintKind.Staffing => PortfolioExplanation.AddBlocker.Staffing,
        _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unexpected resource constraint."),
    };
}
