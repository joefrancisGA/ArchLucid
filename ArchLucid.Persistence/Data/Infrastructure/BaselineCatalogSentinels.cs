using System.Globalization;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>
///     Sentinel probes for <see cref="GreenfieldBaselineMigrationRunner" /> drift repair (TB-069).
///     Stamping never runs without at least one tenant-core or governance-workflow sentinel when skipping full replay.
/// </summary>
internal readonly record struct BaselineCatalogSentinels(
    bool JournalRecordsInitialSchema001,
    bool TenantCoreTablesPresent,
    bool GovernanceWorkflow038Present,
    bool DboRunsPresent,
    bool DboAuditEventsPresent,
    bool DboRunTelemetryPresent)
{
    public bool RequiresDriftRepair => TenantCoreTablesPresent || GovernanceWorkflow038Present;

    public static BaselineCatalogSentinels Read(SqlConnection connection)
    {
        return new BaselineCatalogSentinels(
            JournalRecordsInitialSchema001: ReadJournalRecordsInitialSchema001(connection),
            TenantCoreTablesPresent: ReadTenantCoreTablesPresent(connection),
            GovernanceWorkflow038Present: ReadGovernanceWorkflow038Present(connection),
            DboRunsPresent: ReadDboRunsPresent(connection),
            DboAuditEventsPresent: ReadDboAuditEventsPresent(connection),
            DboRunTelemetryPresent: ReadDboRunTelemetryPresent(connection));
    }

    private static bool ReadJournalRecordsInitialSchema001(SqlConnection connection)
    {
        const string sql = """
                           IF OBJECT_ID(N'dbo.SchemaVersions', N'U') IS NULL
                               SELECT CAST(0 AS bit);
                           ELSE IF EXISTS (
                               SELECT 1
                               FROM dbo.SchemaVersions
                               WHERE ScriptName LIKE N'%001_InitialSchema%')
                               SELECT CAST(1 AS bit);
                           ELSE
                               SELECT CAST(0 AS bit);
                           """;

        return ReadBooleanScalar(connection, sql);
    }

    private static bool ReadTenantCoreTablesPresent(SqlConnection connection)
    {
        const string sql = """
                           SELECT CASE
                               WHEN OBJECT_ID(N'dbo.ArchitectureRequests', N'U') IS NOT NULL THEN 1
                               WHEN OBJECT_ID(QUOTENAME(SCHEMA_NAME()) + N'.ArchitectureRequests', N'U') IS NOT NULL THEN 1
                               WHEN EXISTS (
                                   SELECT 1
                                   FROM sys.objects AS o
                                   INNER JOIN sys.schemas AS s ON o.schema_id = s.schema_id
                                   WHERE o.name = N'ArchitectureRequests'
                                     AND s.name = SCHEMA_NAME()
                                     AND o.is_ms_shipped = 0
                               ) THEN 1
                               WHEN EXISTS (
                                   SELECT 1
                                   FROM sys.tables AS t
                                   WHERE t.name = N'ArchitectureRequests'
                                     AND t.is_ms_shipped = 0
                               ) THEN 1
                               ELSE 0
                           END;
                           """;

        return ReadBooleanScalar(connection, sql);
    }

    private static bool ReadGovernanceWorkflow038Present(SqlConnection connection)
    {
        const string sql = """
                           SELECT CASE WHEN EXISTS (
                               SELECT 1
                               FROM sys.tables AS t
                               WHERE t.name IN (
                                   N'GovernanceApprovalRequests',
                                   N'GovernancePromotionRecords',
                                   N'GovernanceEnvironmentActivations')
                                 AND t.is_ms_shipped = 0
                           ) THEN 1 ELSE 0 END;
                           """;

        return ReadBooleanScalar(connection, sql);
    }

    private static bool ReadDboRunsPresent(SqlConnection connection)
    {
        const string sql = """
                           SELECT CASE WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN 1 ELSE 0 END;
                           """;

        return ReadBooleanScalar(connection, sql);
    }

    private static bool ReadDboAuditEventsPresent(SqlConnection connection)
    {
        const string sql = """
                           SELECT CASE WHEN OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL THEN 1 ELSE 0 END;
                           """;

        return ReadBooleanScalar(connection, sql);
    }

    private static bool ReadDboRunTelemetryPresent(SqlConnection connection)
    {
        const string sql = """
                           SELECT CASE WHEN OBJECT_ID(N'dbo.RunTelemetry', N'U') IS NOT NULL THEN 1 ELSE 0 END;
                           """;

        return ReadBooleanScalar(connection, sql);
    }

    private static bool ReadBooleanScalar(SqlConnection connection, string sql)
    {
        using SqlCommand command = new(sql, connection);
        object? scalar = command.ExecuteScalar();

        if (scalar is null or DBNull)
            return false;

        if (scalar is bool asBool)
            return asBool;

        return Convert.ToInt32(scalar, CultureInfo.InvariantCulture) != 0;
    }
}
