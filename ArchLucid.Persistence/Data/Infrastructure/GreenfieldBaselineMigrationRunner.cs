using System.Globalization;
using System.Reflection;
using System.Text.RegularExpressions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>
///     On a brand-new SQL catalog, replays embedded forward migrations <c>001</c>–<c>050</c> and stamps
///     <c>dbo.SchemaVersions</c> so DbUp continues at <c>051+</c>. Existing catalogs that already ran
///     <c>001_InitialSchema</c> are left on the incremental path.
/// </summary>
public static partial class GreenfieldBaselineMigrationRunner
{
    private const string BaselineResourceSubstring = ".Migrations.Baseline.";

    /// <summary>Returns embedded resource names for root <c>Migrations/NNN_*.sql</c> only (excludes Baseline folder).</summary>
    public static IReadOnlyList<string> GetOrderedIncrementalMigrationResourceNames()
    {
        Assembly assembly = Assembly.GetExecutingAssembly();

        return assembly.GetManifestResourceNames()
            .Where(static n =>
                n.Contains(".Migrations.", StringComparison.OrdinalIgnoreCase) &&
                n.EndsWith(".sql", StringComparison.OrdinalIgnoreCase) &&
                !n.Contains(BaselineResourceSubstring, StringComparison.OrdinalIgnoreCase) &&
                !SqlMigrationPlanes.IsSystemPlaneScript(n))
            .OrderBy(static n => n, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    /// <summary>
    ///     When <c>dbo.SchemaVersions</c> does not yet record <c>001_InitialSchema</c>, repairs the catalog and stamps
    ///     <c>001</c>–<c>050</c> so DbUp continues at <c>051+</c>. No-op once that journal row exists.
    /// </summary>
    /// <remarks>
    ///     Decision flow is documented in <c>docs/library/SQL_SCRIPTS.md</c> section 4.0.1 (TB-069). Sentinel probes live in
    ///     <see cref="BaselineCatalogSentinels" />; repair planning in <see cref="BaselineRepairPlanner" />.
    /// </remarks>
    public static void TryApplyBaselineAndStampThrough050(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("Connection string is required.", nameof(connectionString));

        string secured = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(connectionString);
        using SqlConnection connection = new(secured);
        connection.Open();

        BaselineCatalogSentinels sentinels = BaselineCatalogSentinels.Read(connection);
        BaselineRepairPlan plan = BaselineRepairPlan.Create(sentinels);

        if (plan.Mode == BaselineRepairMode.None)
            return;

        Assembly assembly = Assembly.GetExecutingAssembly();

        if (plan.Mode == BaselineRepairMode.FullReplay)
        {
            try
            {
                ExecuteIncrementalMigrationScriptsInInclusiveRange(connection, assembly, 1, 50);
                CommitBaselineJournalThrough050(connection);

                return;
            }
            catch (SqlException ex) when (IsKnownDuplicateInitialMigrationTable(ex) ||
                                          IsKnownDuplicateBaselineConstraintName(ex))
            {
                sentinels = BaselineCatalogSentinels.Read(connection);
                plan = BaselineRepairPlan.Create(sentinels);

                if (plan.Mode == BaselineRepairMode.DriftRepair)
                {
                    ExecuteDriftRepair(connection, assembly, plan);

                    return;
                }

                // Partial replay without sentinel drift: stamp 001–050 so DbUp continues at 051+.
                CommitBaselineJournalThrough050(connection);
                StampRunTelemetryMigration138WhenDboTableExists(connection, null);
                StampBuyerSpineScriptsThrough295WhenReviewsPresent(connection, null);

                return;
            }
        }

        if (plan.Mode == BaselineRepairMode.DriftRepair)
            ExecuteDriftRepair(connection, assembly, plan);
    }

    private static void ExecuteDriftRepair(SqlConnection connection, Assembly assembly, BaselineRepairPlan plan)
    {
        BaselineCatalogSentinels sentinels = BaselineCatalogSentinels.Read(connection);

        if (!sentinels.RequiresDriftRepair)
            throw new InvalidOperationException(
                "Baseline drift repair refused: tenant-core or governance-workflow sentinel tables are absent.");

        if (plan.SparseReplayMinInclusive is int minInclusive)
        {
            try
            {
                ExecuteIncrementalMigrationScriptsInInclusiveRange(
                    connection,
                    assembly,
                    minInclusive,
                    plan.SparseReplayMaxInclusive);
            }
            catch (SqlException ex) when (IsKnownDuplicateInitialMigrationTable(ex) ||
                                          IsKnownDuplicateBaselineConstraintName(ex))
            {
                // Objects from 017–050 may already exist while SchemaVersions is empty; stamp so DbUp does not replay DDL.
            }
        }

        CommitBaselineJournalThrough050(connection);
        StampRunTelemetryMigration138WhenDboTableExists(connection, null);
        StampBuyerSpineScriptsThrough295WhenReviewsPresent(connection, null);
    }

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

    /// <summary>
    ///     Runs embedded incremental migrations whose script number is in <paramref name="minInclusive" />–
    ///     <paramref name="maxInclusive" /> (inclusive).
    /// </summary>
    private static void ExecuteIncrementalMigrationScriptsInInclusiveRange(
        SqlConnection connection,
        Assembly assembly,
        int minInclusive,
        int maxInclusive)
    {
        foreach (string resourceName in GetOrderedIncrementalMigrationResourceNames())
        {
            Match match = MigrationNumberRegex().Match(resourceName);

            if (!match.Success)
                continue;

            int n = int.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);

            if (n < minInclusive || n > maxInclusive)
                continue;

            if (ShouldSkipEmbeddedMigrationResourceAlreadyApplied(connection, resourceName))
                continue;

            string sql = ReadEmbeddedScript(assembly, resourceName);
            IReadOnlyList<string> batches = SplitGoBatches(sql);

            foreach (string batch in batches)
            {
                if (string.IsNullOrWhiteSpace(batch))
                    continue;

                using SqlCommand batchCommand = new(batch, connection);
                batchCommand.CommandTimeout = 0;
                batchCommand.ExecuteNonQuery();
            }
        }
    }

    /// <summary>
    ///     The workflow script is not idempotent; skip it when its tables already exist so replay can still apply graph
    ///     parents and the rest of the <c>017</c>–<c>050</c> batch.
    /// </summary>
    private static bool ShouldSkipEmbeddedMigrationResourceAlreadyApplied(SqlConnection connection, string resourceName)
    {
        return resourceName.Contains("038_GovernanceWorkflow", StringComparison.OrdinalIgnoreCase)
               && BaselineCatalogSentinels.Read(connection).GovernanceWorkflow038Present;
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

    [GeneratedRegex(@"\.Migrations\.(\d{3})_", RegexOptions.CultureInvariant)]
    private static partial Regex MigrationNumberRegex();

    private static string ReadEmbeddedScript(Assembly assembly, string name)
    {
        using Stream? stream = assembly.GetManifestResourceStream(name);

        if (stream is null)
            throw new InvalidOperationException($"Missing embedded migration script '{name}'.");

        using StreamReader reader = new(stream);
        return reader.ReadToEnd();
    }

    private static IReadOnlyList<string> SplitGoBatches(string script)
    {
        string[] lines = script.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n');
        List<string> batches = [];
        List<string> current = [];

        foreach (string line in lines)

            if (line.Trim().Equals("GO", StringComparison.OrdinalIgnoreCase))
            {
                batches.Add(string.Join(Environment.NewLine, current));
                current.Clear();
            }
            else

                current.Add(line);

        if (current.Count > 0)
            batches.Add(string.Join(Environment.NewLine, current));

        return batches;
    }
}
