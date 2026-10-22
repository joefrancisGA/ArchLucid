using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Mapping;

public class GraphNodeFactory : IGraphNodeFactory
{
    public GraphNode CreateNode(CanonicalObject item)
    {
        ArgumentNullException.ThrowIfNull(item);

        ArgumentException.ThrowIfNullOrWhiteSpace(item.ObjectId);
        ArgumentException.ThrowIfNullOrWhiteSpace(item.ObjectType);
        ArgumentException.ThrowIfNullOrWhiteSpace(item.Name);

        Dictionary<string, string> properties = item.Properties ?? [];

        try
        {
            properties = NormalizePropertyBag(
                new Dictionary<string, string>(properties, StringComparer.OrdinalIgnoreCase));
        }
        catch (ArgumentException ex)
        {
            throw new ArgumentException(
                "CanonicalObject.Properties contains duplicate keys that collide under ordinal case-insensitive comparison.",
                nameof(item),
                ex);
        }

        properties.TryGetValue("category", out string? category);

        string objectId = item.ObjectId.Trim();
        string nodeType = item.ObjectType.Trim();

        return new GraphNode
        {
            NodeId = $"obj-{objectId}",
            NodeType = nodeType,
            Label = item.Name.Trim(),
            Category = string.IsNullOrWhiteSpace(category) ? category : category.Trim(),
            SourceType = string.IsNullOrWhiteSpace(item.SourceType) ? item.SourceType : item.SourceType.Trim(),
            SourceId = string.IsNullOrWhiteSpace(item.SourceId) ? item.SourceId : item.SourceId.Trim(),
            Properties = properties
        };
    }

    private static Dictionary<string, string> NormalizePropertyBag(Dictionary<string, string> properties)
    {
        Dictionary<string, string> normalized = new(properties.Comparer);

        foreach (KeyValuePair<string, string> entry in properties)
        {
            normalized[entry.Key] = string.IsNullOrWhiteSpace(entry.Value)
                ? entry.Value
                : entry.Value.Trim();
        }

        return normalized;
    }
}
