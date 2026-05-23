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
            properties = new Dictionary<string, string>(properties, StringComparer.OrdinalIgnoreCase);
        }
        catch (ArgumentException ex)
        {
            throw new ArgumentException(
                "CanonicalObject.Properties contains duplicate keys that collide under ordinal case-insensitive comparison.",
                nameof(item),
                ex);
        }

        properties.TryGetValue("category", out string? category);

        return new GraphNode
        {
            NodeId = $"obj-{item.ObjectId}",
            NodeType = item.ObjectType,
            Label = item.Name,
            Category = category,
            SourceType = item.SourceType,
            SourceId = item.SourceId,
            Properties = properties
        };
    }
}
