using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Unifies graph-pure <see cref="IFindingEngine"/> and effectful
///     <see cref="IEffectfulFindingEngine"/> so orchestration merge is one path.
/// </summary>
internal sealed record EngineAdapter(
    string EngineType,
    string Category,
    Func<GraphSnapshot, CancellationToken, Task<IReadOnlyList<Finding>>> AnalyzeAsync)
{
    public static EngineAdapter FromGraphPure(IFindingEngine engine)
    {
        ArgumentNullException.ThrowIfNull(engine);

        return new EngineAdapter(engine.EngineType, engine.Category, engine.AnalyzeAsync);
    }

    public static EngineAdapter FromEffectful(IEffectfulFindingEngine engine)
    {
        ArgumentNullException.ThrowIfNull(engine);

        return new EngineAdapter(engine.EngineType, engine.Category, engine.AnalyzeAsync);
    }

    public static IReadOnlyList<EngineAdapter> FromEngines(
        IEnumerable<IFindingEngine> graphPureEngines,
        IEnumerable<IEffectfulFindingEngine>? effectfulEngines)
    {
        ArgumentNullException.ThrowIfNull(graphPureEngines);

        IEnumerable<EngineAdapter> graphPure = graphPureEngines.Select(FromGraphPure);
        IEnumerable<EngineAdapter> effectful = (effectfulEngines ?? []).Select(FromEffectful);

        return graphPure.Concat(effectful).ToArray();
    }
}
