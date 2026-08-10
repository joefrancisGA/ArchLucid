using System.Text.Json.Serialization;

using ArchLucid.Contracts.Agents;

namespace ArchLucid.Persistence.Serialization;

/// <summary>Source-generated JSON metadata for <see cref="AgentResult" /> persistence reads (TB-2162).</summary>
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    WriteIndented = false,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull)]
[JsonSerializable(typeof(AgentResult))]
[JsonSerializable(typeof(List<AgentResult>))]
[JsonSerializable(typeof(List<string>))]
public partial class AgentResultJsonSerializerContext : JsonSerializerContext;
