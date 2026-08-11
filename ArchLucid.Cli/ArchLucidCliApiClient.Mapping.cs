using System.Diagnostics.CodeAnalysis;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;

using Gen = ArchLucid.Api.Client.Generated;

namespace ArchLucid.Cli;

/// <summary>
///     Contracts ↔ generated-DTO bridging. The generated request types use numeric enums, so mapping
///     must round-trip through the matching serializer options rather than the CLI defaults.
/// </summary>
public sealed partial class ArchLucidApiClient
{
    private TOut? DeserializeRoundTrip<TOut>(object? value)
    {
        if (value is null) return default;
        string json = JsonSerializer.Serialize(value, value.GetType(), _jsonOptions);

        return JsonSerializer.Deserialize<TOut>(json, ContractEnumAwareJson);
    }

    private static TBody? MapToOpenApiRequestBody<TBody>(object? payload, JsonSerializerOptions options)
        where TBody : class, new()
    {
        if (payload is null)
            return null;

        string json = JsonSerializer.Serialize(payload, options);
        using JsonDocument doc = JsonDocument.Parse(json);
        Dictionary<string, object> additional = new(StringComparer.Ordinal);

        foreach (JsonProperty prop in doc.RootElement.EnumerateObject())
        {
            additional[prop.Name] = JsonSerializer.Deserialize<object>(prop.Value.GetRawText(), options)!;
        }

        TBody body = new();
        System.Reflection.PropertyInfo? additionalProperties = typeof(TBody).GetProperty("AdditionalProperties");

        if (additionalProperties is null)
            throw new InvalidOperationException($"Generated request body type {typeof(TBody).Name} is missing AdditionalProperties.");

        additionalProperties.SetValue(body, additional);

        return body;
    }

    private static TGen? MapContractToGenerated<TGen>(object contract)
    {
        string json = JsonSerializer.Serialize(contract, ContractEnumAwareJson);

        return JsonSerializer.Deserialize<TGen>(json, ContractEnumAwareJson);
    }

    private TOut? MapGeneratedToContract<TOut>(object? generated)
    {
        if (generated is null)
            return default;

        string json = JsonSerializer.Serialize(generated, generated.GetType(), ContractEnumAwareJson);

        return JsonSerializer.Deserialize<TOut>(json, ContractEnumAwareJson);
    }

    private static Gen.ArchitectureRequest? MapToGenerated(ArchitectureRequest request)
    {
        string json = JsonSerializer.Serialize(request, GenNumericEnumBridgeJson);

        return JsonSerializer.Deserialize<Gen.ArchitectureRequest>(json, GenNumericEnumBridgeJson);
    }

    private static Gen.AgentResult? MapToGenerated(AgentResult result)
    {
        string json = JsonSerializer.Serialize(result, GenNumericEnumBridgeJson);

        return JsonSerializer.Deserialize<Gen.AgentResult>(json, GenNumericEnumBridgeJson);
    }
}
