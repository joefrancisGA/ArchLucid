using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Persistence.Serialization;

/// <summary>
///     Tolerates alternate property names when reading <see cref="GraphEdge" /> rows (e.g. <c>id</c> for <c>edgeId</c>).
/// </summary>
public sealed class GraphEdgeJsonConverter : JsonConverter<GraphEdge>
{
    public override GraphEdge Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using JsonDocument doc = JsonDocument.ParseValue(ref reader);
        JsonElement root = doc.RootElement;
        if (root.ValueKind != JsonValueKind.Object)
            throw new JsonException("Expected JSON object for GraphEdge.");

        return new GraphEdge
        {
            EdgeId = GraphJsonElementReaders.ReadFirstString(root, "edgeId", "id") ?? "",
            FromNodeId = GraphJsonElementReaders.ReadFirstString(root, "fromNodeId", "from", "source") ?? "",
            ToNodeId = GraphJsonElementReaders.ReadFirstString(root, "toNodeId", "to", "target") ?? "",
            EdgeType = GraphJsonElementReaders.ReadFirstString(root, "edgeType", "type", "relation") ?? "",
            Label = GraphJsonElementReaders.ReadFirstString(root, "label"),
            Weight = GraphJsonElementReaders.ReadFirstDouble(root, "weight") ?? 1d,
            InferenceSource = GraphJsonElementReaders.ReadFirstString(root, "inferenceSource"),
            ReasoningTrace = GraphJsonElementReaders.ReadFirstString(root, "reasoningTrace"),
            Properties = GraphJsonElementReaders.ReadProperties(root, options)
        };
    }

    public override void Write(Utf8JsonWriter writer, GraphEdge value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("edgeId", value.EdgeId);
        writer.WriteString("fromNodeId", value.FromNodeId);
        writer.WriteString("toNodeId", value.ToNodeId);
        writer.WriteString("edgeType", value.EdgeType);
        if (value.Label is null)
            writer.WriteNull("label");
        else
            writer.WriteString("label", value.Label);
        writer.WriteNumber("weight", value.Weight);
        if (value.InferenceSource is null)
            writer.WriteNull("inferenceSource");
        else
            writer.WriteString("inferenceSource", value.InferenceSource);
        if (value.ReasoningTrace is null)
            writer.WriteNull("reasoningTrace");
        else
            writer.WriteString("reasoningTrace", value.ReasoningTrace);
        writer.WritePropertyName("properties");
        JsonSerializer.Serialize(writer, value.Properties, options);
        writer.WriteEndObject();
    }
}
