using System.Data;

using Dapper;

namespace ArchLucid.Persistence.RelationalRead;

/// <summary>
///     Shared relational slice read helpers for JSON fallback and ordered string-column hydration.
/// </summary>
internal static class RelationalSliceReadCore
{
    public static async Task<List<string>> LoadOrderedStringsAsync(
        IDbConnection connection,
        string sql,
        object param,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentException.ThrowIfNullOrWhiteSpace(sql);
        ArgumentNullException.ThrowIfNull(param);

        IEnumerable<string> rows = await connection.QueryAsync<string>(
            new CommandDefinition(sql, param, transaction, cancellationToken: ct));

        return rows.ToList();
    }

    public static T DeserializeOrNew<T>(string? json, Func<string, T> deserialize)
        where T : class, new()
    {
        ArgumentNullException.ThrowIfNull(deserialize);

        if (string.IsNullOrWhiteSpace(json))
            return new T();

        try
        {
            return deserialize(json) ?? new T();
        }
        catch (InvalidOperationException)
        {
            return new T();
        }
    }
}
