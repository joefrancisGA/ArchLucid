using System.Data;

using ArchLucid.Persistence.Serialization;

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

    public static List<string> DeserializeStringListOrEmpty(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonEntitySerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch (InvalidOperationException)
        {
            return [];
        }
    }

    public static List<T> DeserializeListOrEmpty<T>(string? json)
        where T : class
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonEntitySerializer.Deserialize<List<T>>(json) ?? [];
        }
        catch (InvalidOperationException)
        {
            return [];
        }
    }

    public static T DeserializeOrDefault<T>(string? json, Func<T> emptyFactory)
        where T : class
    {
        ArgumentNullException.ThrowIfNull(emptyFactory);

        if (string.IsNullOrWhiteSpace(json))
            return emptyFactory();

        try
        {
            return JsonEntitySerializer.Deserialize<T>(json) ?? emptyFactory();
        }
        catch (InvalidOperationException)
        {
            return emptyFactory();
        }
    }

    public static Dictionary<string, string> DeserializeOrdinalStringDictionaryOrEmpty(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new Dictionary<string, string>(StringComparer.Ordinal);

        try
        {
            Dictionary<string, string> parsed = JsonEntitySerializer.Deserialize<Dictionary<string, string>>(json);
            Dictionary<string, string> ordinal = new(StringComparer.Ordinal);

            foreach (KeyValuePair<string, string> pair in parsed)
                ordinal[pair.Key] = pair.Value;

            return ordinal;
        }
        catch (InvalidOperationException)
        {
            return new Dictionary<string, string>(StringComparer.Ordinal);
        }
    }

    public static TEnum ParseEnumOrDefault<TEnum>(string? value, TEnum fallback)
        where TEnum : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value))
            return fallback;

        return Enum.TryParse(value, ignoreCase: true, out TEnum parsed) ? parsed : fallback;
    }
}
