using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Interfaces;

/// <summary>
///     Graph-pure finding engine: <see cref="AnalyzeAsync"/> must not query I/O beyond
///     <see cref="GraphSnapshot"/>. Constructor-injected graph analyzers that only read the
///     snapshot are allowed. This is the plugin contract. Effectful inventory and cost
///     engines implement <see cref="IEffectfulFindingEngine"/> instead.
/// </summary>
public interface IFindingEngine
{
    string EngineType
    {
        get;
    }

    string Category
    {
        get;
    }

    Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        CancellationToken ct);
}
