using System.Globalization;
using System.Text.RegularExpressions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Infrastructure;

public static partial class GreenfieldBaselineMigrationRunner
{
    private static void CommitBaselineJournalThrough050(SqlConnection connection)
    {
        EnsureSchemaVersionsTable(connection, null);
        StampIncrementalScriptsThrough050(connection, null);
    }

    /// <summary>
    ///     Journal drift: after stamping <c>001</c>–<c>050</c>, DbUp replays <c>051</c>+. When <c>dbo.RunTelemetry</c>
    ///     already exists from a prior successful migrate, pre-stamp <c>138_RunTelemetry.sql</c> so DbUp skips redundant
    ///     DDL during drift recovery.
    /// </summary>
    private static void StampRunTelemetryMigration138WhenDboTableExists(SqlConnection connection, SqlTransaction? tx)
    {
        if (!BaselineCatalogSentinels.Read(connection).DboRunTelemetryPresent)
            return;

        string? resourceName = GetOrderedIncrementalMigrationResourceNames()
            .FirstOrDefault(static n => n.Contains("138_RunTelemetry", StringComparison.OrdinalIgnoreCase));

        if (string.IsNullOrEmpty(resourceName))
            return;

        StampScriptNameIfMissing(connection, tx, resourceName);
    }

    /// <summary>
    ///     ADR 0064: when <c>dbo.Reviews</c> already exists, <c>dbo.Runs</c> is a synonym. Replaying <c>051</c>–<c>295</c>
    ///     can still hit non-idempotent index/DDL paths; stamp those scripts so DbUp continues at <c>296</c>+.
    /// </summary>
    private static void StampBuyerSpineScriptsThrough295WhenReviewsPresent(SqlConnection connection, SqlTransaction? tx)
    {
        using SqlCommand probe = new(
            "SELECT CASE WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN 1 ELSE 0 END;",
            connection,
            tx);
        object? scalar = probe.ExecuteScalar();

        if (scalar is null or DBNull || Convert.ToInt32(scalar, CultureInfo.InvariantCulture) == 0)
            return;

        foreach (string resourceName in GetOrderedIncrementalMigrationResourceNames())
        {
            Match match = MigrationNumberRegex().Match(resourceName);

            if (!match.Success)
                continue;

            int n = int.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);

            if (n is < 51 or > 295)
                continue;

            StampScriptNameIfMissing(connection, tx, resourceName);
        }
    }

    private static void StampScriptNameIfMissing(SqlConnection connection, SqlTransaction? tx, string resourceName)
    {
        using SqlCommand stamp = new(
            """
            IF NOT EXISTS (SELECT 1 FROM dbo.SchemaVersions WHERE ScriptName = @ScriptName)
                INSERT INTO dbo.SchemaVersions (ScriptName, Applied) VALUES (@ScriptName, SYSUTCDATETIME());
            """,
            connection,
            tx);
        stamp.Parameters.AddWithValue("@ScriptName", resourceName);
        stamp.ExecuteNonQuery();
    }

    private static void EnsureSchemaVersionsTable(SqlConnection connection, SqlTransaction? tx)
    {
        const string ddl = """
                           IF OBJECT_ID(N'dbo.SchemaVersions', N'U') IS NULL
                           BEGIN
                               CREATE TABLE [dbo].[SchemaVersions] (
                                   [Id] [int] IDENTITY(1,1) NOT NULL CONSTRAINT [PK_SchemaVersions_Id] PRIMARY KEY CLUSTERED,
                                   [ScriptName] [nvarchar](255) NOT NULL,
                                   [Applied] [datetime] NOT NULL
                               );
                           END
                           """;

        using SqlCommand command = new(ddl, connection, tx);
        command.ExecuteNonQuery();
    }

    private static void StampIncrementalScriptsThrough050(SqlConnection connection, SqlTransaction? tx)
    {
        IReadOnlyList<string> incremental = GetOrderedIncrementalMigrationResourceNames();
        Regex numberRegex = MigrationNumberRegex();

        foreach (string resourceName in incremental)
        {
            Match match = numberRegex.Match(resourceName);

            if (!match.Success)
                continue;

            int n = int.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);

            if (n is < 1 or > 50)
                continue;

            using SqlCommand stamp = new(
                """
                IF NOT EXISTS (SELECT 1 FROM dbo.SchemaVersions WHERE ScriptName = @ScriptName)
                    INSERT INTO dbo.SchemaVersions (ScriptName, Applied) VALUES (@ScriptName, SYSUTCDATETIME());
                """,
                connection,
                tx);
            stamp.Parameters.AddWithValue("@ScriptName", resourceName);
            stamp.ExecuteNonQuery();
        }
    }
}
