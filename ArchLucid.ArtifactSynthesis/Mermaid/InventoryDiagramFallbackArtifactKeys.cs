namespace ArchLucid.ArtifactSynthesis.Mermaid;

/// <summary>Stable fallback and picker keys for inventory diagram partitions (IE-17).</summary>
public static class InventoryDiagramFallbackArtifactKeys
{
    public const string FullMachine = "full-machine";
    public const string Executive = "executive";
    public const string Network = "network";
    public const string Identity = "identity";
    public const string Data = "data";
    public const string CrossBoundary = "cross-boundary";
    public const string ResourceGroupModeKey = "resourceGroup";
    public const string ResourceGroupKeyPrefix = "resourceGroup:";

    public static string ForResourceGroup(string resourceGroupName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceGroupName);

        return ResourceGroupKeyPrefix + resourceGroupName.Trim();
    }

    public static bool IsFullMachine(string? key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return false;
        }

        return string.Equals(key.Trim(), FullMachine, StringComparison.OrdinalIgnoreCase);
    }

    public static bool TryReadResourceGroupName(string? key, out string resourceGroupName)
    {
        resourceGroupName = string.Empty;

        if (string.IsNullOrWhiteSpace(key))
        {
            return false;
        }

        string trimmed = key.Trim();

        if (trimmed.StartsWith(ResourceGroupKeyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            string name = trimmed[ResourceGroupKeyPrefix.Length..].Trim();

            if (name.Length == 0)
            {
                return false;
            }

            resourceGroupName = name;
            return true;
        }

        if (string.Equals(trimmed, ResourceGroupModeKey, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, FullMachine, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, Executive, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, Network, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, Identity, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, Data, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, CrossBoundary, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        resourceGroupName = trimmed;
        return true;
    }
}
