using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Costing;

/// <summary>Maps GCP Terraform resource types to costing <see cref="RuntimePlatform"/> values.</summary>
public static class GcpResourceCostMapper
{
    /// <summary>Infers costing platform from Terraform type tail (e.g. <c>google_compute_instance</c>).</summary>
    public static RuntimePlatform? TryInferPlatformFromTerraformType(string? terraformType)
    {
        if (string.IsNullOrWhiteSpace(terraformType))
            return null;

        ReadOnlySpan<char> tail = TerraformTypeTail.Normalize(terraformType);

        if (tail.Equals("google_compute_instance".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.ComputeEngine;

        if (tail.Equals("google_container_cluster".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.Gke;

        if (tail.Equals("google_sql_database_instance".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.CloudSql;

        if (tail.Equals("google_storage_bucket".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.Gcs;

        return null;
    }
}
