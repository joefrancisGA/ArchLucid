using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Deserializes <see cref="DatastoreType" /> from enum names, integers, and common live-LLM aliases.
/// </summary>
public sealed class DatastoreTypeJsonConverter : JsonConverter<DatastoreType>
{
    public override DatastoreType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return (DatastoreType)reader.GetInt32();

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for datastore type.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return DatastoreType.Unknown;

        if (Enum.TryParse(raw, ignoreCase: true, out DatastoreType parsed))
            return parsed;

        return raw.Trim().ToLowerInvariant() switch
        {
            "sql" or "relational" or "sql database" or "azure sql" or "azure sql database" or "azuresql" or "database" or "rdbms" => DatastoreType.Sql,
            "nosql" or "document" or "cosmos" or "cosmosdb" or "mongodb" => DatastoreType.NoSql,
            "object" or "blob" or "blob storage" or "storage" => DatastoreType.Object,
            "cache" or "redis" or "in-memory" or "inmemory" => DatastoreType.Cache,
            "search" or "vector" or "index" or "azure ai search" => DatastoreType.Search,
            _ => DatastoreType.Unknown,
        };
    }

    public override void Write(Utf8JsonWriter writer, DatastoreType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
