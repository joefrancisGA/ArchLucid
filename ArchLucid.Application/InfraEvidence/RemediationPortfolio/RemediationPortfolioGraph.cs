using ArchLucid.Application.Analysis;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

/// <summary>Versioned advisory input for the optimizer. Neither the graph nor an evaluation authorizes execution.</summary>
public sealed class RemediationPortfolioGraph
{
    public const string SchemaVersion = "FND088-portfolio-graph-v1";
    public string Version => SchemaVersion;
    public PortfolioBinding Binding { get; }
    public string ProposalSha256 { get; }
    public string GraphSha256 { get; }
    public bool CanEvaluateSelections { get; }
    public IReadOnlyList<PortfolioActionNode> Actions { get; }
    public IReadOnlyList<PortfolioCauseNode> Causes { get; }
    public IReadOnlyList<PortfolioScenarioNode> Scenarios { get; }
    public IReadOnlyList<PortfolioRelationshipEdge> Relationships { get; }
    public IReadOnlyList<PortfolioCoverageClause> Coverage { get; }
    public IReadOnlyList<PortfolioIssue> Issues { get; }

    internal RemediationPortfolioGraph(PortfolioBinding binding, string proposalSha256, bool canEvaluateSelections,
        IEnumerable<PortfolioActionNode> actions, IEnumerable<PortfolioCauseNode> causes,
        IEnumerable<PortfolioScenarioNode> scenarios, IEnumerable<PortfolioRelationshipEdge> relationships,
        IEnumerable<PortfolioCoverageClause> coverage, IEnumerable<PortfolioIssue> issues)
    {
        Binding = binding;
        ProposalSha256 = proposalSha256;
        CanEvaluateSelections = canEvaluateSelections;
        Actions = Freeze(actions.OrderBy(row => row.Id, StringComparer.Ordinal));
        Causes = Freeze(causes.OrderBy(row => row.Id, StringComparer.Ordinal));
        Scenarios = Freeze(scenarios.OrderBy(row => row.Id, StringComparer.Ordinal));
        Relationships = Freeze(relationships.OrderBy(row => row.Relationship)
            .ThenBy(row => row.FirstActionId, StringComparer.Ordinal).ThenBy(row => row.SecondActionId, StringComparer.Ordinal));
        Coverage = Freeze(coverage.OrderBy(row => row.ScenarioId, StringComparer.Ordinal)
            .ThenBy(row => string.Join(",", row.AllActionIds), StringComparer.Ordinal));
        Issues = SortIssues(issues);
        GraphSha256 = AnalysisDependencyFingerprint.Digest(new
        {
            Version, Binding, ProposalSha256, CanEvaluateSelections, Actions, Causes, Scenarios, Relationships, Coverage, Issues,
        });
    }

    /// <summary>Validate a proposed selection and count each covered scenario exactly once. No scoring or optimization.</summary>
    public PortfolioSelectionResult EvaluateSelection(IEnumerable<string> selectedActionIds)
    {
        ArgumentNullException.ThrowIfNull(selectedActionIds);
        var requested = selectedActionIds.Take(RemediationPortfolioGraphBuilder.MaxActions + 1).ToArray();
        if (requested.Length > RemediationPortfolioGraphBuilder.MaxActions)
            throw new ArgumentException("Selection exceeds the graph action limit.", nameof(selectedActionIds));

        var selected = new HashSet<string>(requested, StringComparer.Ordinal);
        var eligible = Actions.Where(node => node.Eligible).Select(node => node.Id).ToHashSet(StringComparer.Ordinal);
        List<PortfolioIssue> issues = [];
        if (!CanEvaluateSelections)
            issues.Add(new("graph", "dependency_or_snapshot_coverage_incomplete"));
        foreach (string id in selected.Where(id => !eligible.Contains(id)))
            issues.Add(new(id ?? string.Empty, "selection_action_unavailable"));

        foreach (PortfolioRelationshipEdge edge in Relationships.Where(edge => selected.Contains(edge.FirstActionId)))
        {
            bool otherSelected = selected.Contains(edge.SecondActionId);
            if (edge.Relationship == PortfolioRelationship.Requires && !otherSelected)
                issues.Add(new(edge.FirstActionId, "selection_prerequisite_missing"));
            if (edge.Relationship == PortfolioRelationship.Conflicts && otherSelected)
                issues.Add(new(edge.FirstActionId, "selection_conflict"));
        }

        bool feasible = issues.Count == 0;
        IReadOnlyList<string> covered = feasible
            ? Freeze(Coverage.Where(clause => clause.AllActionIds.All(selected.Contains))
                .Select(clause => clause.ScenarioId).Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal))
            : [];
        var supported = Coverage.Select(clause => clause.ScenarioId).ToHashSet(StringComparer.Ordinal);
        IReadOnlyList<string> unknown = Freeze(Scenarios.Where(s => !s.Reviewed || !supported.Contains(s.Id))
            .Select(s => s.Id));
        return new(feasible, covered, unknown, SortIssues(issues));
    }

    internal static IReadOnlyList<T> Freeze<T>(IEnumerable<T> values) => Array.AsReadOnly(values.ToArray());

    internal static IReadOnlyList<PortfolioIssue> SortIssues(IEnumerable<PortfolioIssue> issues) =>
        Freeze(issues.Distinct().OrderBy(item => item.SubjectId, StringComparer.Ordinal)
            .ThenBy(item => item.Reason, StringComparer.Ordinal));
}
