namespace ArchLucid.Decisioning.Plugins;

/// <summary>
///     Wave-5 suggestion 50: plugin collision skip set sourced from DI registration at host start.
/// </summary>
public static class RegisteredFindingEngineTypeRegistry
{
    private static IReadOnlySet<string> _registeredEngineTypeIds = BuiltInFindingEngineTypeCatalog.EngineTypeIds;

    public static IReadOnlySet<string> RegisteredEngineTypeIds => _registeredEngineTypeIds;

    public static void ReplaceRegisteredEngineTypeIds(IReadOnlySet<string> engineTypeIds)
    {
        ArgumentNullException.ThrowIfNull(engineTypeIds);
        _registeredEngineTypeIds = engineTypeIds;
    }
}
