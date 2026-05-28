using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Interfaces;

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
