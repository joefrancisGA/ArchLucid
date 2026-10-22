using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Common;

/// <summary>
///     Deserializes <see cref="ServiceType" /> from enum names, integers, and common live-LLM aliases.
/// </summary>
public sealed class ServiceTypeJsonConverter : JsonConverter<ServiceType>
{
    public override ServiceType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
            return DefinedEnumStringReader.ReadNumberTokenAsDefinedOrdinal<ServiceType>(
                ref reader,
                ordinal => new JsonException($"Unknown service type value '{ordinal}'."),
                () => new JsonException("Invalid service type number."));

        if (reader.TokenType != JsonTokenType.String)
            throw new JsonException("Expected string or number for service type.");

        string? raw = reader.GetString();

        if (string.IsNullOrWhiteSpace(raw))
            return ServiceType.Unknown;

        DefinedEnumStringReader.ThrowIfUndefinedNumericString<ServiceType>(
            raw,
            $"Unknown service type value '{raw}'.");

        if (DefinedEnumStringReader.TryParse(raw, out ServiceType parsed))
            return parsed;

        return raw.Trim().ToLowerInvariant() switch
        {
            "web" or "frontend" or "front-end" or "front end" or "ui" or "webapp" or "web app" or "web-app" => ServiceType.Ui,
            "api" or "backend" or "rest" or "graphql" or "microservice" or "micro-service" => ServiceType.Api,
            "worker" or "queue" or "background" or "job" or "processor" => ServiceType.Worker,
            "integration" or "adapter" or "connector" or "gateway" => ServiceType.Integration,
            "data" or "database" or "db" or "sql" or "sql database" or "storage" or "datastore" or "data service" or "data-service" => ServiceType.DataService,
            "search" or "index" or "retrieval" => ServiceType.SearchService,
            "ai" or "ml" or "llm" or "model" or "inference" => ServiceType.AiService,
            _ => ServiceType.Unknown,
        };
    }

    public override void Write(Utf8JsonWriter writer, ServiceType value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
