using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Serialization;

/// <summary>Shared source-generated JSON options for <see cref="AgentResult" /> SQL persistence reads.</summary>
public static class AgentResultJsonSerialization
{
    private static readonly AgentResultJsonSerializerContext SerializerContext = CreateSerializerContext();

    /// <summary>Read-only options for deserializing stored <c>ResultJson</c> and rollup fragments.</summary>
    public static JsonSerializerOptions DeserializeOptions
    {
        get;
    } = CreateDeserializeOptions();

    public static AgentResult? DeserializeAgentResult(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        return JsonSerializer.Deserialize(json, SerializerContext.AgentResult);
    }

    private static AgentResultJsonSerializerContext CreateSerializerContext()
    {
        JsonSerializerOptions options = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        };

        RegisterConverters(options);

        AgentResultJsonSerializerContext context = new(options);
        options.MakeReadOnly();

        return context;
    }

    private static JsonSerializerOptions CreateDeserializeOptions()
    {
        JsonSerializerOptions options = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            TypeInfoResolver = JsonTypeInfoResolver.Combine(
                SerializerContext,
                new DefaultJsonTypeInfoResolver()),
        };

        RegisterConverters(options);
        options.MakeReadOnly();

        return options;
    }

    private static void RegisterConverters(JsonSerializerOptions options)
    {
        options.Converters.Add(new AgentResultClaimListJsonConverter());
        options.Converters.Add(new AgentTopologyProposalJsonConverter());
        options.Converters.Add(new JsonStringEnumConverter<AgentType>(allowIntegerValues: true));
        options.Converters.Add(new JsonStringEnumConverter<FindingConfidenceLevel>(allowIntegerValues: true));
        options.Converters.Add(new EvalCorpusFindingSeverityJsonConverter());
    }
}
