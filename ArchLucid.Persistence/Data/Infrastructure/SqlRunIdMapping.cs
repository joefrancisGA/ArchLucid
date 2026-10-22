namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>
///     Converts run identifiers between the API/contract string form and the authority
///     <c>dbo.Runs.RunId</c> <c>UNIQUEIDENTIFIER</c> form. This is a type-mapping concern, not a
///     tenant-scope concern, so it is kept separate from <see cref="RunChildRunScopeSql" />.
/// </summary>
internal static class SqlRunIdMapping
{
    /// <summary>
    ///     Maps contract/API run id strings to <c>UNIQUEIDENTIFIER</c> parameters. Dapper sends <see cref="string" /> as
    ///     <c>NVARCHAR</c>, which SQL Server cannot always coerce into <c>UNIQUEIDENTIFIER</c> (especially <c>N</c> format).
    /// </summary>
    internal static Guid ToSqlRunId(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId.Trim(), out Guid parsed))
        {
            throw new ArgumentException(
                "Run id must parse as a GUID for SQL UNIQUEIDENTIFIER columns.",
                nameof(runId));
        }

        return parsed;
    }

    /// <summary>Maps authority <c>dbo.Runs.RunId</c> keys to API contract run id strings (<c>N</c> format).</summary>
    internal static string ToContractRunId(Guid runId) => runId.ToString("N");
}
