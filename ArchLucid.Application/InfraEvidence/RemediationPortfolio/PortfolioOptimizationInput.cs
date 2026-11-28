using ArchLucid.Application.Analysis;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

internal static class PortfolioOptimizationInput
{
    internal const int MaxRankedFindings = 8_192;
    internal const int MaxTeams = 32;
    private const int MaxScenarios = 1_024;
    private const long MaxUnits = 1_000_000_000_000;

    internal static PortfolioOptimizationRequest? Snapshot(RemediationPortfolioGraph graph, PortfolioOptimizationRequest value)
    {
        if (value.Limits is not { } limits || value.TopN is not { } top || value.Search is not { } search
            || !Token(value.ObjectiveVersion) || !Token(value.ConstraintVersion) || !Token(top.RankingVersion)
            || limits.Currency is not { Length: 3 } || !limits.Currency.All(c => c is >= 'A' and <= 'Z')
            || !Units(limits.Cost) || !Units(limits.Disruption)
            || search.MaxSearchNodes is < 1 or > 100_000 || search.MaxBaselineEvaluations is < 1 or > 8_192
            || search.Timeout <= TimeSpan.Zero || search.Timeout > TimeSpan.FromSeconds(10)
            || top.TargetSize is < 1 or > RemediationPortfolioGraphBuilder.MaxActions)
            return null;

        var teamLimits = Teams(limits.Staff);
        var ranks = Bounded(top.OrderedFindingIds, MaxRankedFindings);
        var mandatory = Bounded(value.MandatoryActionIds, RemediationPortfolioGraphBuilder.MaxActions);
        var weights = Bounded(value.ScenarioWeights, MaxScenarios);
        var estimates = Bounded(value.Estimates, RemediationPortfolioGraphBuilder.MaxActions);
        if (teamLimits is null || ranks is null || ranks.Any(id => id == Guid.Empty) || !Unique(ranks)
            || mandatory is null || !Unique(mandatory) || weights is null || estimates is null)
            return null;

        var actionIds = graph.Actions.Select(action => action.Id).ToHashSet(StringComparer.Ordinal);
        var scenarioIds = graph.Scenarios.Select(scenario => scenario.Id).ToHashSet(StringComparer.Ordinal);
        if (mandatory.Any(id => !actionIds.Contains(id))
            || weights.Any(row => row is null || !scenarioIds.Contains(row.ScenarioId) || !Units(row.Points))
            || !Unique(weights.Select(row => row.ScenarioId))
            || !graph.Coverage.Select(row => row.ScenarioId).ToHashSet(StringComparer.Ordinal)
                .IsSubsetOf(weights.Select(row => row.ScenarioId)))
            return null;

        var teams = teamLimits.Select(team => team.TeamKey).ToHashSet(StringComparer.Ordinal);
        List<PortfolioActionEstimate> normalizedEstimates = [];
        foreach (var row in estimates)
        {
            if (row is null || !actionIds.Contains(row.ActionId) || !Token(row.BasisId)
                || !ValidQuantity(row.Cost) || !ValidQuantity(row.Disruption))
                return null;
            var staff = Teams(row.Staff);
            if (row.Staff is null ? row.StaffKind != PortfolioEstimateKind.Unknown
                : staff is null || !Known(row.StaffKind) || staff.Any(team => !teams.Contains(team.TeamKey)))
                return null;
            normalizedEstimates.Add(row with { Staff = staff });
        }

        if (!Unique(normalizedEstimates.Select(row => row.ActionId)))
            return null;
        return value with
        {
            Limits = limits with { Staff = teamLimits },
            TopN = top with { OrderedFindingIds = RemediationPortfolioGraph.Freeze(ranks) },
            MandatoryActionIds = RemediationPortfolioGraph.Freeze(mandatory.Order(StringComparer.Ordinal)),
            ScenarioWeights = RemediationPortfolioGraph.Freeze(weights.OrderBy(row => row.ScenarioId, StringComparer.Ordinal)),
            Estimates = RemediationPortfolioGraph.Freeze(normalizedEstimates.OrderBy(row => row.ActionId, StringComparer.Ordinal)),
        };
    }

    internal static string Digest(PortfolioOptimizationRequest snapshot, string solverVersion) =>
        AnalysisDependencyFingerprint.Digest(new { SolverVersion = solverVersion, Request = snapshot });

    private static IReadOnlyList<PortfolioTeamMinutes>? Teams(IReadOnlyList<PortfolioTeamMinutes>? rows)
    {
        var values = Bounded(rows, MaxTeams);
        if (values is null || values.Any(row => row is null || !Token(row.TeamKey) || !Units(row.Minutes))
            || !Unique(values.Select(row => row.TeamKey)))
            return null;
        return RemediationPortfolioGraph.Freeze(values.OrderBy(row => row.TeamKey, StringComparer.Ordinal));
    }

    private static T[]? Bounded<T>(IReadOnlyList<T>? rows, int max) =>
        rows is null || rows.Count > max ? null : rows.ToArray();

    private static bool Unique<T>(IEnumerable<T> values)
    {
        HashSet<T> seen = [];
        return values.All(seen.Add);
    }

    private static bool Units(long units) => units is >= 0 and <= MaxUnits;

    private static bool Token(string? value) => value is { Length: > 0 and <= 128 } && !string.IsNullOrWhiteSpace(value)
        && string.Equals(value, value.Trim(), StringComparison.Ordinal) && !value.Any(char.IsControl);

    private static bool Known(PortfolioEstimateKind kind) =>
        kind is PortfolioEstimateKind.Measured or PortfolioEstimateKind.ReviewedEstimate or PortfolioEstimateKind.ApprovedDefault;

    private static bool ValidQuantity(PortfolioEstimatedUnits? quantity) => quantity is not null
        && (quantity.Units is long units ? Units(units) && Known(quantity.Kind) : quantity.Kind == PortfolioEstimateKind.Unknown);
}
