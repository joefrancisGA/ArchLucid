namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

internal sealed class PortfolioOptimizationModel
{
    private readonly RemediationPortfolioGraph graph;
    private readonly PortfolioOptimizationRequest input;
    private readonly UInt128[] requirements;
    private readonly UInt128[] conflicts;
    private readonly ActionCost[] costs;
    private readonly Scenario[] scenarios;

    private sealed record ActionCost(long Money, long Disruption, long[] Staff);
    private sealed record Scenario(long Points, UInt128[] Clauses);

    internal UInt128 Mandatory { get; }
    internal UInt128 EvidenceAvailable { get; }
    internal UInt128 Available { get; }
    internal UInt128 Searchable { get; }
    internal IReadOnlyList<UInt128> BeneficialBundles { get; }
    internal IReadOnlyList<UInt128> RankedActions { get; }
    internal IReadOnlyList<PortfolioIssue> Issues { get; }

    internal PortfolioOptimizationModel(RemediationPortfolioGraph graph, PortfolioOptimizationRequest input)
    {
        this.graph = graph;
        this.input = input;
        var index = graph.Actions.Select((action, i) => (action.Id, i))
            .ToDictionary(pair => pair.Id, pair => pair.i, StringComparer.Ordinal);
        var estimates = input.Estimates.ToDictionary(row => row.ActionId, StringComparer.Ordinal);
        var teams = input.Limits.Staff.Select((row, i) => (row.TeamKey, i))
            .ToDictionary(pair => pair.TeamKey, pair => pair.i, StringComparer.Ordinal);
        var ranks = input.TopN.OrderedFindingIds.Select((id, i) => (id, i)).ToDictionary(pair => pair.id, pair => pair.i);
        int count = graph.Actions.Count;
        requirements = Enumerable.Range(0, count).Select(Bit).ToArray();
        conflicts = new UInt128[count];
        costs = new ActionCost[count];
        List<PortfolioIssue> issues = [.. graph.Issues];
        UInt128 eligible = 0;
        UInt128 estimated = 0;
        List<(int Rank, int Action)> ranked = [];
        for (int i = 0; i < count; i++)
        {
            var action = graph.Actions[i];
            if (action.Eligible)
                eligible |= Bit(i);
            var staff = new long[teams.Count];
            if (estimates.TryGetValue(action.Id, out var estimate)
                && estimate.Cost.Units is long money && estimate.Disruption.Units is long downtime && estimate.Staff is { } staffing)
            {
                foreach (var use in staffing)
                    staff[teams[use.TeamKey]] = use.Minutes;
                costs[i] = new(money, downtime, staff);
                estimated |= Bit(i);
            }
            else
            {
                costs[i] = new(0, 0, staff); // Not selectable; placeholder values never enter a plan.
                if (action.Eligible)
                    issues.Add(new(action.Id, "resource_estimate_missing"));
            }

            int rank = action.FindingIds.Select(id => ranks.GetValueOrDefault(id, int.MaxValue)).DefaultIfEmpty(int.MaxValue).Min();
            if (rank != int.MaxValue)
                ranked.Add((rank, i));
        }

        foreach (var edge in graph.Relationships)
        {
            int first = index[edge.FirstActionId];
            int second = index[edge.SecondActionId];
            if (edge.Relationship == PortfolioRelationship.Requires)
                requirements[first] |= Bit(second);
            else if (edge.Relationship == PortfolioRelationship.Conflicts)
            {
                conflicts[first] |= Bit(second);
                conflicts[second] |= Bit(first);
            }
        }

        for (int via = 0; via < count; via++)
        for (int start = 0; start < count; start++)
        {
            if ((requirements[start] & Bit(via)) != 0)
                requirements[start] |= requirements[via];
        }

        UInt128 evidenceAvailable = 0;
        UInt128 available = 0;
        for (int i = 0; i < count; i++)
        {
            if (!Contains(eligible, requirements[i]))
                continue;
            evidenceAvailable |= Bit(i);
            if (Contains(estimated, requirements[i]))
                available |= Bit(i);
            else if ((estimated & Bit(i)) != 0)
                issues.Add(new(graph.Actions[i].Id, "prerequisite_resource_estimate_missing"));
        }

        EvidenceAvailable = evidenceAvailable;
        Available = available;
        Mandatory = input.MandatoryActionIds.Aggregate(UInt128.Zero, (mask, id) => mask | requirements[index[id]]);
        Issues = RemediationPortfolioGraph.SortIssues(issues);
        RankedActions = RemediationPortfolioGraph.Freeze(ranked.OrderBy(row => row.Rank).ThenBy(row => row.Action)
            .Select(row => Bit(row.Action)).Where(bit => (bit & Available) != 0)
            .Take(input.TopN.TargetSize));
        var weights = input.ScenarioWeights.ToDictionary(row => row.ScenarioId, row => row.Points, StringComparer.Ordinal);
        scenarios = graph.Coverage.GroupBy(row => row.ScenarioId, StringComparer.Ordinal)
            .Select(group => new Scenario(weights[group.Key], group.Select(row => row.AllActionIds
                .Aggregate(UInt128.Zero, (mask, id) => mask | requirements[index[id]]))
                .Where(mask => Contains(Available, mask)).Distinct().ToArray()))
            .Where(row => row.Clauses.Length != 0 && row.Points != 0).ToArray();
        BeneficialBundles = RemediationPortfolioGraph.Freeze(scenarios.SelectMany(row => row.Clauses).Distinct().Order());
        Searchable = BeneficialBundles.Aggregate(Mandatory, (mask, bundle) => mask | bundle);
    }

    internal UInt128 Closure(UInt128 bit) => requirements[Index(bit)];

    internal bool IsFeasible(UInt128 selected)
    {
        if (!Contains(Available, selected) || !Contains(selected, Mandatory))
            return false;
        Span<long> staff = stackalloc long[PortfolioOptimizationInput.MaxTeams];
        staff.Clear();
        long money = 0;
        long disruption = 0;
        for (UInt128 bits = selected; bits != 0; bits &= bits - 1)
        {
            int i = Index(bits);
            if (!Contains(selected, requirements[i]) || (conflicts[i] & selected) != 0)
                return false;
            var cost = costs[i];
            money += cost.Money;
            disruption += cost.Disruption;
            if (money > input.Limits.Cost || disruption > input.Limits.Disruption)
                return false;
            for (int t = 0; t < cost.Staff.Length; t++)
            {
                staff[t] += cost.Staff[t];
                if (staff[t] > input.Limits.Staff[t].Minutes)
                    return false;
            }
        }
        return true;
    }

    internal long Score(UInt128 selectedOrPossible)
    {
        long total = 0;
        foreach (var scenario in scenarios)
        {
            foreach (UInt128 clause in scenario.Clauses)
            {
                if (!Contains(selectedOrPossible, clause))
                    continue;
                total += scenario.Points;
                break;
            }
        }
        return total;
    }

    internal PortfolioAdvisoryPlan Describe(UInt128 selected)
    {
        long money = 0;
        long disruption = 0;
        var staff = new long[input.Limits.Staff.Count];
        List<string> actions = [];
        for (UInt128 bits = selected; bits != 0; bits &= bits - 1)
        {
            int i = Index(bits);
            actions.Add(graph.Actions[i].Id);
            money += costs[i].Money;
            disruption += costs[i].Disruption;
            for (int t = 0; t < staff.Length; t++)
                staff[t] += costs[i].Staff[t];
        }

        var evaluated = graph.EvaluateSelection(actions);
        if (!evaluated.Feasible || !IsFeasible(selected))
            throw new InvalidOperationException("An internal advisory candidate did not pass final feasibility validation.");

        var weights = input.ScenarioWeights.ToDictionary(row => row.ScenarioId, row => row.Points, StringComparer.Ordinal);
        long graphScore = evaluated.CoveredScenarioIds.Sum(id => weights[id]);
        if (graphScore != Score(selected))
            throw new InvalidOperationException("Portfolio coverage disagreed with the pinned dependency graph.");

        return new(RemediationPortfolioGraph.Freeze(actions), evaluated.CoveredScenarioIds, evaluated.UnknownScenarioIds, graphScore,
            new(money, RemediationPortfolioGraph.Freeze(input.Limits.Staff.Select((team, i) => team with { Minutes = staff[i] })), disruption));
    }

    internal static bool Contains(UInt128 set, UInt128 subset) => (set & subset) == subset;
    internal static UInt128 Bit(int index) => UInt128.One << index;
    internal static int Index(UInt128 bits) => (int)UInt128.TrailingZeroCount(bits);
}
