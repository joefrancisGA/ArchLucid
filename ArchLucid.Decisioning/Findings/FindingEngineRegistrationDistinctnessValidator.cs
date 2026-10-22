using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Fail-closed when a registered product engine type is missing from
///     <see cref="Plugins.BuiltInFindingEngineTypeCatalog" /> or duplicates exist at runtime.
/// </summary>
public static class FindingEngineRegistrationDistinctnessValidator
{
    public static void ValidateOrThrow(
        IEnumerable<IFindingEngine> graphPureEngines,
        IEnumerable<IEffectfulFindingEngine>? effectfulEngines)
    {
        ArgumentNullException.ThrowIfNull(graphPureEngines);

        Dictionary<string, string> owners = new(StringComparer.OrdinalIgnoreCase);

        foreach (IFindingEngine engine in graphPureEngines)
        {
            RegisterEngineType(owners, engine.EngineType, engine.GetType().FullName ?? engine.GetType().Name);
        }

        foreach (IEffectfulFindingEngine engine in effectfulEngines ?? [])
        {
            RegisterEngineType(owners, engine.EngineType, engine.GetType().FullName ?? engine.GetType().Name);
        }

        HashSet<string> catalog = Plugins.BuiltInFindingEngineTypeCatalog.EngineTypeIds
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<string> missingFromCatalog = owners.Keys
            .Where(engineType => !catalog.Contains(engineType))
            .OrderBy(static id => id, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (missingFromCatalog.Count > 0)
        {
            throw new InvalidOperationException(
                "Registered finding engine types are missing from BuiltInFindingEngineTypeCatalog: "
                + string.Join(", ", missingFromCatalog));
        }
    }

    private static void RegisterEngineType(Dictionary<string, string> owners, string engineType, string ownerType)
    {
        if (string.IsNullOrWhiteSpace(engineType))
            throw new InvalidOperationException($"Finding engine {ownerType} has an empty EngineType.");

        if (owners.TryGetValue(engineType, out string? existingOwner))
        {
            throw new InvalidOperationException(
                $"Duplicate finding EngineType '{engineType}' registered by {existingOwner} and {ownerType}.");
        }

        owners[engineType] = ownerType;
    }
}
