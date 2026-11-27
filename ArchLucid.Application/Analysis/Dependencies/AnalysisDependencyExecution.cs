using System.Text.Json;

using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Analysis;

/// <summary>Per-run planner. The graph is shared, but only same-run witnessed outputs satisfy its edges.</summary>
internal sealed class AnalysisDependencyExecution(AnalysisDependencyGraph graph, ProjectScopeKey scope, Guid executionId)
{
    private readonly Dictionary<string, string> _completed = new(StringComparer.Ordinal);
    private readonly Dictionary<string, AnalysisDependencyDecision> _changes = new(StringComparer.Ordinal);

    public IReadOnlyList<string> Order => graph.Order;

    public string? OutputWitness(string stage) => _completed.GetValueOrDefault(stage);

    public AnalysisDependencyBinding BindInputs<T>(string stage, T inputs)
    {
        JsonElement serialized = JsonSerializer.SerializeToElement(inputs);
        var fingerprints = serialized.EnumerateObject().OrderBy(item => item.Name, StringComparer.Ordinal)
            .Select(item => new KeyValuePair<string, string>(item.Name, AnalysisDependencyFingerprint.Digest(item.Value)))
            .ToArray();
        return Bind(stage, AnalysisDependencyFingerprint.Digest(fingerprints)) with { LocalInputs = fingerprints };
    }

    public AnalysisDependencyBinding Bind(string stage, string localWitness)
    {
        IReadOnlyList<string> required = graph.Requirements(stage);
        List<KeyValuePair<string, string>> upstream = [];
        string? missing = null;

        foreach (string parent in required)
        {
            if (_completed.TryGetValue(parent, out string? digest))
                upstream.Add(new(parent, digest));
            else
                missing ??= parent;
        }

        return new(graph.Version, localWitness, AnalysisDependencyFingerprint.Create(scope, stage,
            executionId, graph.Version, localWitness, upstream), upstream.AsReadOnly(), missing);
    }

    public AnalysisDependencyDecision Observe(string stage, AnalysisDependencyBinding binding, string? checkpointRejection,
        bool legacyReuse, bool enforce, ILogger logger)
    {
        if (binding.MissingStage is { } missing)
            _changes[missing] = new(AnalysisDependencyAction.Blocked, "required_dependency_unavailable", missing);

        if (checkpointRejection is not null)
            _changes[stage] = new(AnalysisDependencyAction.Recompute, checkpointRejection);

        AnalysisDependencyDecision decision = graph.Plan(_changes)[stage];
        logger.LogInformation(
            "Analysis dependency decision. ExecutionId={ExecutionId} Stage={Stage} Graph={Graph} Mode={Mode} Decision={Decision} Reason={Reason} Trigger={Trigger} LegacyReuse={LegacyReuse}",
            executionId, stage, binding.GraphVersion, enforce ? "enforce" : "shadow",
            decision.ActionName, decision.Reason, decision.Trigger, legacyReuse);

        if (enforce && decision.Action == AnalysisDependencyAction.Blocked)
            throw new AnalysisDependencyRejectionException(stage, "incomplete_engine_coverage");

        return decision;
    }

    public void Record(string stage, string inputVersion, string resultReference, long fence)
    {
        // A replaced upstream attempt invalidates its dependents even when it returns the same exact reference.
        _completed[stage] = AnalysisDependencyFingerprint.Digest(new { inputVersion, resultReference, fence });
        _changes.Remove(stage);
    }

    public void RecordFailure(string stage) => _changes[stage] = new(AnalysisDependencyAction.Blocked, "required_dependency_unavailable", stage);
}
