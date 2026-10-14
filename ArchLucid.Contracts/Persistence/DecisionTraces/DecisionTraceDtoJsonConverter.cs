using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.DecisionTraces;

public sealed class DecisionTraceDtoJsonConverter : JsonConverter<DecisionTraceDto>
{
    public override DecisionTraceDto Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using JsonDocument document = JsonDocument.ParseValue(ref reader);
        JsonElement root = document.RootElement;

        if (!root.TryGetProperty("kind", out JsonElement kindElement))
            throw new JsonException("Decision trace JSON must include a numeric \"kind\" discriminator.");

        if (!TryReadDecisionTraceKind(kindElement, out DecisionTraceKind kind))
            throw new JsonException("Decision trace JSON \"kind\" must be a defined discriminator.");

        if (kind == DecisionTraceKind.RunEvent)
        {
            if (!root.TryGetProperty("runEvent", out JsonElement runEventElement) ||
                runEventElement.ValueKind == JsonValueKind.Null)

                throw new JsonException("RunEvent trace requires a non-null \"runEvent\" object.");

            RunEventTracePayload? payload = runEventElement.Deserialize<RunEventTracePayload>(options);

            return payload is null
                ? throw new JsonException("RunEvent trace \"runEvent\" deserialized to null.")
                : RunEventTraceDto.From(payload);
        }

        if (kind == DecisionTraceKind.RuleAudit)
        {
            if (!root.TryGetProperty("ruleAudit", out JsonElement ruleAuditElement) ||
                ruleAuditElement.ValueKind == JsonValueKind.Null)

                throw new JsonException("RuleAudit trace requires a non-null \"ruleAudit\" object.");

            RuleAuditTracePayload? payload = ruleAuditElement.Deserialize<RuleAuditTracePayload>(options);

            return payload is null
                ? throw new JsonException("RuleAudit trace \"ruleAudit\" deserialized to null.")
                : RuleAuditTraceDto.From(payload);
        }

        throw new JsonException($"Unsupported decision trace kind '{kind}'.");
    }

    private static bool TryReadDecisionTraceKind(JsonElement kindElement, out DecisionTraceKind kind)
    {
        if (DefinedEnumStringReader.TryReadDefinedOrdinal(
                kindElement,
                out kind,
                numeric => new JsonException($"Unknown decision trace kind value '{numeric}'.")))
        {
            return true;
        }

        if (kindElement.ValueKind != JsonValueKind.String)
            return false;

        string? raw = kindElement.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        DefinedEnumStringReader.ThrowIfUndefinedNumericString<DecisionTraceKind>(
            raw,
            $"Unknown decision trace kind value '{raw}'.");

        if (DefinedEnumStringReader.TryParse(raw, out kind))
            return true;

        throw new JsonException($"Unknown decision trace kind value '{raw}'.");
    }

    public override void Write(Utf8JsonWriter writer, DecisionTraceDto value, JsonSerializerOptions options)
    {
        ArgumentNullException.ThrowIfNull(value);

        writer.WriteStartObject();
        writer.WriteNumber("kind", (int)value.Kind);

        switch (value)
        {
            case RunEventTraceDto runEvent:
                writer.WritePropertyName("runEvent");
                JsonSerializer.Serialize(writer, runEvent.RunEvent, options);
                break;

            case RuleAuditTraceDto ruleAudit:
                writer.WritePropertyName("ruleAudit");
                JsonSerializer.Serialize(writer, ruleAudit.RuleAudit, options);
                break;

            default:
                throw new NotSupportedException($"Unsupported decision trace runtime type '{value.GetType().Name}'.");
        }

        writer.WriteEndObject();
    }
}
