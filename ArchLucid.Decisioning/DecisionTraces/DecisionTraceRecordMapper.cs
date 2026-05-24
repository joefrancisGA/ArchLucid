using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;

namespace ArchLucid.Decisioning.DecisionTraces;

/// <summary>
///     Maps between decisioning domain traces and persistence DTOs via JSON round-trip (shared wire shape).
/// </summary>
public static class DecisionTraceRecordMapper
{
    private static readonly JsonSerializerOptions JsonOptions = CreateJsonOptions();

    public static DecisionTraceDto ToDto(DecisionTrace domain)
    {
        ArgumentNullException.ThrowIfNull(domain);
        string json = JsonSerializer.Serialize(domain, JsonOptions);
        DecisionTraceDto? dto = JsonSerializer.Deserialize<DecisionTraceDto>(json, JsonOptions);

        return dto ?? throw new InvalidOperationException("Decision trace domain-to-DTO round-trip produced null.");
    }

    public static DecisionTrace ToDomain(DecisionTraceDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        string json = JsonSerializer.Serialize(dto, JsonOptions);
        DecisionTrace? domain = JsonSerializer.Deserialize<DecisionTrace>(json, JsonOptions);

        return domain ?? throw new InvalidOperationException("Decision trace DTO-to-domain round-trip produced null.");
    }

    private static JsonSerializerOptions CreateJsonOptions()
    {
        JsonSerializerOptions options = new(ContractJson.Default);
        options.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));

        return options;
    }
}
