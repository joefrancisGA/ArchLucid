namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Replica / geo-redundancy property keys for SQL, storage, and cluster declarations (DX-08).
///     Any present non-disabled value satisfies the requirement.
/// </summary>
public static class DrReplicaPropertyHeuristic
{
    private static readonly string[] ReplicaPropertyKeys =
    [
        "zone_redundant",
        "geo_redundant",
        "failover_group",
        "availability_mode",
        "tf.zone_redundant",
        "tf.geo_redundant",
        "tf.failover_group",
        "tf.availability_mode",
        "read_replica",
        "readreplicacount",
        "read_replica_count",
        "standby_count",
        "replica_capacity",
        "storage_replication_type",
        "high_availability",
        "geo_backup_enabled",
        "secondary_server_id",
        "partner_server_id",
        "azurerm_mssql_failover_group",
        "aws_rds_replica",
    ];

    public static bool HasReplicaEvidence(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.IsNullOrWhiteSpace(entry.Value))
            {
                continue;
            }

            if (!IsReplicaPropertyKey(entry.Key))
            {
                continue;
            }

            if (IsDisabledReplicaValue(entry.Value))
            {
                continue;
            }

            return true;
        }

        return false;
    }

    private static bool IsReplicaPropertyKey(string key)
    {
        foreach (string candidate in ReplicaPropertyKeys)
        {
            if (string.Equals(key, candidate, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (key.Contains(candidate, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return key.Contains("failover", StringComparison.OrdinalIgnoreCase)
            || key.Contains("replica", StringComparison.OrdinalIgnoreCase)
            || key.Contains("geo_redundant", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsDisabledReplicaValue(string value)
    {
        string normalized = value.Trim();

        return string.Equals(normalized, "false", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "disabled", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "none", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "lrs", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "0", StringComparison.OrdinalIgnoreCase);
    }
}
