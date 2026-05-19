using System.Text.Json.Serialization;

using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Serialization;

/// <summary>
///     Source-generated <see cref="System.Text.Json" /> metadata for knowledge-graph DTOs and list payloads.
/// </summary>
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    WriteIndented = false)]
[JsonSerializable(typeof(GraphSnapshot))]
[JsonSerializable(typeof(GraphNode))]
[JsonSerializable(typeof(GraphEdge))]
[JsonSerializable(typeof(GraphBuildResult))]
[JsonSerializable(typeof(List<GraphSnapshot>))]
[JsonSerializable(typeof(List<GraphNode>))]
[JsonSerializable(typeof(List<GraphEdge>))]
[JsonSerializable(typeof(List<string>))]
[JsonSerializable(typeof(Dictionary<string, string>))]
public partial class GraphJsonSerializerContext : JsonSerializerContext;
