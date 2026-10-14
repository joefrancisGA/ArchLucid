using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Deserializes <see cref="StructuralExecutionMode" /> from enum names or defined integer ordinals.
/// </summary>
public sealed class StructuralExecutionModeJsonConverter : JsonConverter<StructuralExecutionMode>
{
    public override StructuralExecutionMode Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<StructuralExecutionMode>(
                ref reader,
                ordinal => new JsonException($"Unknown structural execution mode value '{ordinal}'."),
                () => new JsonException("Invalid structural execution mode number."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for structural execution mode.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            throw new JsonException("Structural execution mode value is required.");

        if (DefinedEnumStringReader.TryParse(raw, out StructuralExecutionMode parsed))
            return parsed;

        throw new JsonException($"Unknown structural execution mode value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, StructuralExecutionMode value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
