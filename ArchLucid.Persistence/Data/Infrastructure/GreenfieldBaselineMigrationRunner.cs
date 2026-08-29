using System.Reflection;

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
}
