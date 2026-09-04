using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Deserializes <see cref="RelationshipType" /> from enum names, integers, and common live-LLM aliases.
/// </summary>
public sealed class RelationshipTypeJsonConverter : JsonConverter<RelationshipType>
{
    public override RelationshipType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            int ordinal = reader.GetInt32();

            if (!Enum.IsDefined(typeof(RelationshipType), ordinal))
                throw new JsonException($"Unknown relationship type value '{ordinal}'.");

            return (RelationshipType)ordinal;
        }

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for relationship type.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException($"Unknown relationship type value '{raw}'.");

        if (Enum.TryParse(raw, ignoreCase: true, out RelationshipType parsed))
            return parsed;

        string normalized = raw.Trim().ToLowerInvariant().Replace("_", " ").Replace("-", " ");

        return normalized switch
        {
            "calls" or "call" or "invoke" or "uses" or "depends on" or "connects to" or "dependency" => RelationshipType.Calls,
            "reads from" or "read from" or "reads" or "read" or "query" or "queries" => RelationshipType.ReadsFrom,
            "writes to" or "write to" or "writes" or "write" or "persist" or "stores" => RelationshipType.WritesTo,
            "publishes to" or "publish to" or "publishes" or "publish" or "emit" or "emits" => RelationshipType.PublishesTo,
            "subscribes to" or "subscribe to" or "subscribes" or "subscribe" or "consume" or "consumes" => RelationshipType.SubscribesTo,
            "authenticates with" or "authenticate with" or "auth" or "authenticates" => RelationshipType.AuthenticatesWith,
            _ => throw new JsonException($"Unknown relationship type value '{raw}'."),
        };
    }

    public override void Write(Utf8JsonWriter writer, RelationshipType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
