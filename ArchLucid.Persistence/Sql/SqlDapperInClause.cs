using Dapper;

namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Builds a numbered <c>IN (@p0, @p1, …)</c> list. Dapper 2.1.79 leaves a literal
///     <c>@Name</c> when a collection is passed through <see cref="CommandDefinition" />
///     (especially a single-element <c>List&lt;string&gt;</c>), which SQL Server rejects
///     with error 102.
/// </summary>
internal static class SqlDapperInClause
{
    public static string AppendStringList(
        DynamicParameters parameters,
        string parameterPrefix,
        IReadOnlyList<string> values)
    {
        ArgumentNullException.ThrowIfNull(parameters);

        if (string.IsNullOrWhiteSpace(parameterPrefix))
            throw new ArgumentException("parameterPrefix is required.", nameof(parameterPrefix));

        ArgumentNullException.ThrowIfNull(values);

        if (values.Count == 0)
            throw new ArgumentException("values must contain at least one entry.", nameof(values));

        string[] placeholders = new string[values.Count];

        for (int i = 0; i < values.Count; i++)
        {
            string name = $"{parameterPrefix}{i}";
            placeholders[i] = "@" + name;
            parameters.Add(name, values[i]);
        }

        return "(" + string.Join(", ", placeholders) + ")";
    }
}
