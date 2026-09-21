namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Fixed catalog of resource tiers the Executive inventory diagram shows in addition to VNets (IDL-06).
/// The list is intentionally code-owned for now: every tenant gets the same four tiers, and a viewer can
/// hide a tier for one render via <see cref="Models.DiagramAstCompileOptions.HiddenExecutiveTierKeys" />.
/// Keys must match <c>INFRA_DIAGRAMS_EXECUTIVE_TIERS</c> in the UI.
/// </summary>
public static class ExecutiveAlwaysShowTiers
{
    public const string WorkloadsKey = "workloads";
    public const string DatabasesKey = "databases";
    public const string StorageKey = "storage";
    public const string IntegrationKey = "integration";

    public static readonly IReadOnlyList<ExecutiveAlwaysShowTier> All =
    [
        new ExecutiveAlwaysShowTier(
            WorkloadsKey,
            "Virtual machines and compute",
            "compute workloads",
            [
                "Microsoft.Compute/virtualMachines",
                "Microsoft.Compute/virtualMachineScaleSets",
                "Microsoft.ContainerService/managedClusters",
                "Microsoft.Web/sites",
            ]),
        new ExecutiveAlwaysShowTier(
            DatabasesKey,
            "Databases",
            "databases",
            [
                "Microsoft.Sql/servers",
                "Microsoft.Sql/servers/databases",
                "Microsoft.Sql/managedInstances",
                "Microsoft.DBforPostgreSQL/flexibleServers",
                "Microsoft.DBforPostgreSQL/servers",
                "Microsoft.DBforMySQL/flexibleServers",
                "Microsoft.DBforMySQL/servers",
                "Microsoft.DocumentDB/databaseAccounts",
                "Microsoft.Cache/Redis",
            ]),
        new ExecutiveAlwaysShowTier(
            StorageKey,
            "Storage accounts",
            "storage accounts",
            ["Microsoft.Storage/storageAccounts"]),
        new ExecutiveAlwaysShowTier(
            IntegrationKey,
            "Data factories",
            "data factories",
            [
                "Microsoft.DataFactory/factories",
                "Microsoft.Synapse/workspaces",
                "Microsoft.Databricks/workspaces",
            ]),
    ];

    private static readonly Dictionary<string, ExecutiveAlwaysShowTier> TierByArmType = All
        .SelectMany(tier => tier.ArmTypes.Select(armType => (ArmType: armType, Tier: tier)))
        .ToDictionary(pair => pair.ArmType, pair => pair.Tier, StringComparer.OrdinalIgnoreCase);

    private static readonly HashSet<string> KnownKeys = All
        .Select(tier => tier.Key)
        .ToHashSet(StringComparer.OrdinalIgnoreCase);

    public static bool IsKnownKey(string? key)
    {
        return !string.IsNullOrWhiteSpace(key) && KnownKeys.Contains(key.Trim());
    }

    public static ExecutiveAlwaysShowTier? TryResolveByArmType(string? armType)
    {
        if (string.IsNullOrWhiteSpace(armType))
        {
            return null;
        }

        return TierByArmType.TryGetValue(armType.Trim(), out ExecutiveAlwaysShowTier? tier) ? tier : null;
    }

    /// <summary>Normalizes a comma-separated query token into distinct known tier keys, dropping anything unknown.</summary>
    public static IReadOnlyList<string> ParseHiddenKeys(string? commaSeparatedKeys)
    {
        if (string.IsNullOrWhiteSpace(commaSeparatedKeys))
        {
            return [];
        }

        return commaSeparatedKeys
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(IsKnownKey)
            .Select(key => All.First(tier => string.Equals(tier.Key, key, StringComparison.OrdinalIgnoreCase)).Key)
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }
}
