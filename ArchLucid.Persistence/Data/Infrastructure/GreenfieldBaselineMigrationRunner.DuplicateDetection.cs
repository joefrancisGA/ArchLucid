using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Infrastructure;

public static partial class GreenfieldBaselineMigrationRunner
{
    /// <summary>
    ///     SQL Server duplicate-object on <c>CREATE TABLE</c> for tables introduced in <c>001</c> or
    ///     <c>038_GovernanceWorkflow</c>
    ///     (error 2714 / "already an object named …") — repaired like the tenant-present path.
    /// </summary>
    internal static bool IsKnownDuplicateInitialMigrationTable(SqlException? ex)
    {
        return ex is not null && IsKnownDuplicateInitialMigrationTable(ex.Message, ex.Number);
    }

    /// <summary>
    ///     Drift repair: replaying <c>027_ArtifactBundleRelational.sql</c> / <c>025_FindingsSnapshotRelational.sql</c> /
    ///     related FK
    ///     hardening on catalogs where the FK already exists (journal drift, shared CI DB, parallel <c>dotnet test</c> before
    ///     the
    ///     <see cref="DatabaseMigrator" /> catalog mutex, or tooling that applied <c>ArchLucid.sql</c> fragments) can raise
    ///     duplicate
    ///     constraint name even when historical migration <c>001–028</c> must not be edited — treat like other baseline
    ///     duplicate-object cases.
    /// </summary>
    internal static bool IsKnownDuplicateBaselineConstraintName(SqlException? ex)
    {
        return ex is not null && IsKnownDuplicateBaselineConstraintName(ex.Message);
    }

    /// <summary>Test seam for <see cref="IsKnownDuplicateBaselineConstraintName(SqlException)" />.</summary>
    internal static bool IsKnownDuplicateBaselineConstraintName(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return false;

        if (!IsKnownDuplicateBaselineConstraintMessage(message))
            return false;

        return message.Contains("already an object named", StringComparison.OrdinalIgnoreCase) ||
               message.Contains("Could not create constraint", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Duplicate FK names from <c>027</c>-style hardening, <c>025_FindingsSnapshotRelational</c>, and
    ///     <c>026_GoldenManifestPhase1Relational</c>
    ///     when journals drift or two processes race before the <see cref="DatabaseMigrator" /> catalog mutex lands.
    /// </summary>
    private static bool IsKnownDuplicateBaselineConstraintMessage(string message)
    {
        if (message.Contains("FK_ArtifactBundles_GoldenManifests_ManifestId", StringComparison.OrdinalIgnoreCase)
            || message.Contains("FK_ArtifactBundles_Runs_RunId", StringComparison.OrdinalIgnoreCase))
            return true;

        if (message.Contains("FK_FindingsSnapshots_", StringComparison.OrdinalIgnoreCase))
            return true;

        return message.Contains("FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId",
            StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Test seam: same predicate as <see cref="IsKnownDuplicateInitialMigrationTable(SqlException)" /> without
    ///     constructing <see cref="SqlException" />.
    /// </summary>
    internal static bool IsKnownDuplicateInitialMigrationTable(string message, int errorNumber)
    {
        if (string.IsNullOrEmpty(message))
            return false;

        if (!ContainsAnyKnownBaselineDuplicateTableName(message))
            return false;

        if (message.Contains("already an object named", StringComparison.OrdinalIgnoreCase))
            return true;

        return errorNumber == 2714;
    }

    private static bool ContainsAnyKnownBaselineDuplicateTableName(string message)
    {
        return message.Contains("ArchitectureRequests", StringComparison.OrdinalIgnoreCase)
               || message.Contains("GovernanceApprovalRequests", StringComparison.OrdinalIgnoreCase)
               || message.Contains("GovernancePromotionRecords", StringComparison.OrdinalIgnoreCase)
               || message.Contains("GovernanceEnvironmentActivations", StringComparison.OrdinalIgnoreCase);
    }
}
