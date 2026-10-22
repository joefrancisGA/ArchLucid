namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>
///     Inserts a line break between a scope predicate and the next SQL keyword.
/// </summary>
internal static class SnapshotListSqlSeparator
{
    /// <summary>
    ///     C# raw string literals drop the newline after the opening quotes. Concatenating
    ///     <c>AND s.ProjectId = @ScopeProjectId</c> directly onto <c>ORDER BY</c> makes SQL
    ///     read one name, <c>@ScopeProjectIdORDER</c> (error 137).
    /// </summary>
    internal static string BeforeOrderBy(string scopePredicate)
    {
        ArgumentNullException.ThrowIfNull(scopePredicate);

        return scopePredicate + "\n";
    }
}
