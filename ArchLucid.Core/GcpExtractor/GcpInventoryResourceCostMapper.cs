using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.GcpExtractor;

/// <summary>Maps GCP inventory asset types to costing <see cref="RuntimePlatform"/> values.</summary>
public static class GcpInventoryResourceCostMapper
{
    /// <summary>Infers costing platform from Cloud Asset Inventory type strings.</summary>
    public static RuntimePlatform? TryInferPlatform(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
            return null;

        ReadOnlySpan<char> type = resourceType.AsSpan().Trim();

        if (Contains(type, "compute.googleapis.com/Instance"))
            return RuntimePlatform.ComputeEngine;

        if (Contains(type, "container.googleapis.com/Cluster"))
            return RuntimePlatform.Gke;

        if (Contains(type, "sqladmin.googleapis.com/Instance"))
            return RuntimePlatform.CloudSql;

        if (Contains(type, "storage.googleapis.com/Bucket"))
            return RuntimePlatform.Gcs;

        return null;
    }

    private static bool Contains(ReadOnlySpan<char> haystack, string needle) =>
        haystack.Contains(needle.AsSpan(), StringComparison.OrdinalIgnoreCase);
}
