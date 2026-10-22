namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>
///     Compares embedded DbUp script inventory against <c>dbo.SchemaVersions</c> journal rows.
/// </summary>
public static class DbUpMigrationStatusEvaluator
{
    /// <summary>
    ///     Returns script resource names from the embedded catalog that are not recorded in
    ///     <paramref name="appliedScriptNames" />.
    /// </summary>
    public static IReadOnlyList<string> FindPendingMigrationScriptNames(IReadOnlyCollection<string> appliedScriptNames)
    {
        ArgumentNullException.ThrowIfNull(appliedScriptNames);

        HashSet<string> applied = new(appliedScriptNames, StringComparer.OrdinalIgnoreCase);

        return DatabaseMigrator.GetOrderedMigrationResourceNames()
            .Where(required => !applied.Contains(required))
            .ToList();
    }
}
