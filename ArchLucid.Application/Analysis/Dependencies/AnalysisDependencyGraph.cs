namespace ArchLucid.Application.Analysis;

/// <summary>Validated, immutable stage topology shared by both recovery pipelines.</summary>
internal sealed class AnalysisDependencyGraph
{
    private readonly IReadOnlyDictionary<string, AnalysisDependencyStage> _stages;

    public AnalysisDependencyGraph(string id, params AnalysisDependencyStage[] stages)
    {
        if (string.IsNullOrWhiteSpace(id) || stages.Length == 0)
            throw new ArgumentException("An analysis graph requires a version and stages.");

        if (stages.Any(stage => string.IsNullOrWhiteSpace(stage.Name)
            || stage.Inputs.Any(string.IsNullOrWhiteSpace) || stage.Requires.Any(string.IsNullOrWhiteSpace)))
            throw new ArgumentException("Analysis graph declarations must use named stages and inputs.");

        _stages = stages.Select(stage => new AnalysisDependencyStage(stage.Name, [.. stage.Inputs], [.. stage.Requires]))
            .ToDictionary(stage => stage.Name, StringComparer.Ordinal);
        List<string> sorted = [];
        HashSet<string> visiting = new(StringComparer.Ordinal);
        HashSet<string> visited = new(StringComparer.Ordinal);

        foreach (string name in _stages.Keys.Order(StringComparer.Ordinal))
            Visit(name);

        Order = sorted.AsReadOnly();
        Version = AnalysisDependencyFingerprint.Digest(new
        {
            Id = id,
            Stages = Order.Select(name => _stages[name]).ToArray(),
        });

        void Visit(string name)
        {
            if (visited.Contains(name))
                return;

            if (!_stages.TryGetValue(name, out AnalysisDependencyStage? stage))
                throw new ArgumentException("An analysis dependency is not registered.");

            if (!visiting.Add(name))
                throw new ArgumentException("The analysis dependency graph has a cycle.");

            foreach (string required in stage.Requires)
                Visit(required);

            visiting.Remove(name);
            visited.Add(name);
            sorted.Add(name);
        }
    }

    public string Version { get; }
    public IReadOnlyList<string> Order { get; }

    public IReadOnlyList<string> Requirements(string stage) => _stages.TryGetValue(stage, out AnalysisDependencyStage? value)
        ? Array.AsReadOnly(value.Requires)
        : throw new AnalysisDependencyRejectionException(stage, "dependency_not_registered");

    /// <summary>Topological closure. Unknown dependencies require a wider recompute, not optimistic reuse.</summary>
    public IReadOnlyDictionary<string, AnalysisDependencyDecision> Plan(
        IReadOnlyDictionary<string, AnalysisDependencyDecision> changes)
    {
        bool unknown = changes.Keys.Any(name => !_stages.ContainsKey(name));
        Dictionary<string, AnalysisDependencyDecision> plan = new(StringComparer.Ordinal);

        foreach (string name in Order)
        {
            string? blockedBy = Requirements(name).FirstOrDefault(parent => plan[parent].Action == AnalysisDependencyAction.Blocked);
            string? changedBy = Requirements(name).FirstOrDefault(parent => plan[parent].Action == AnalysisDependencyAction.Recompute);
            plan[name] = blockedBy is not null ? new(AnalysisDependencyAction.Blocked, "required_dependency_unavailable", blockedBy)
                : changes.TryGetValue(name, out AnalysisDependencyDecision? own) ? own
                : unknown ? new(AnalysisDependencyAction.Recompute, "dependency_not_registered")
                : changedBy is not null ? new(AnalysisDependencyAction.Recompute, "upstream_invalidated", changedBy)
                : new(AnalysisDependencyAction.Reuse, "verified_bindings");
        }

        return plan;
    }
}
