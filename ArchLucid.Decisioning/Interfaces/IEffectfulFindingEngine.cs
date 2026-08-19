using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Interfaces;

/// <summary>
///     Effectful finding engine: implementations may query extractors, SQL, or options
///     in addition to <see cref="GraphSnapshot"/>. This is not the plugin contract;
///     plugins implement graph-pure <see cref="IFindingEngine"/>.
/// </summary>
public interface IEffectfulFindingEngine
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
