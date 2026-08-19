using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Materializes <see cref="GraphNodeTypes.Actor" /> and <see cref="GraphNodeTypes.TrustBoundary" /> nodes from
///     draft actor JSON (TB-2344).
/// </summary>
public static class RequestActorMaterializer
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public static IReadOnlyList<GraphNode> MaterializeFromActorsJson(string? actorsJson, Guid snapshotId)
    {
        if (string.IsNullOrWhiteSpace(actorsJson))
            return [];

        List<ActorDescriptor>? actors;

        try
        {
            actors = JsonSerializer.Deserialize<List<ActorDescriptor>>(actorsJson, SerializerOptions);
        }
        catch (JsonException)
        {
            return [];
        }

        if (actors is not { Count: > 0 })
            return [];

        List<GraphNode> nodes = [];
        int index = 0;

        foreach (ActorDescriptor actor in actors)
        {
            index++;
            string label = string.IsNullOrWhiteSpace(actor.Label) ? $"Actor {index}" : actor.Label.Trim();
            string actorNodeId = $"actor-{snapshotId:N}-{index}";

            Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
            {
                ["kind"] = actor.Kind.ToString(),
                ["trustOrigin"] = actor.TrustOrigin.ToString(),
                ["contract"] = actor.Contract.ToString(),
                ["origin"] = actor.Origin.ToString(),
                ["confidence"] = actor.Confidence.ToString(System.Globalization.CultureInfo.InvariantCulture),
            };

            nodes.Add(new GraphNode
            {
                NodeId = actorNodeId,
                NodeType = GraphNodeTypes.Actor,
                Label = label,
                SourceType = "RequestActor",
                SourceId = snapshotId.ToString(),
                Properties = properties,
            });

            if (actor.TrustOrigin is TrustOrigin.External or TrustOrigin.PublicAnonymous)
            {
                nodes.Add(new GraphNode
                {
                    NodeId = $"trust-boundary-{snapshotId:N}-{index}",
                    NodeType = GraphNodeTypes.TrustBoundary,
                    Label = $"Trust boundary for {label}",
                    SourceType = "RequestActor",
                    SourceId = snapshotId.ToString(),
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["trustOrigin"] = actor.TrustOrigin.ToString(),
                        ["actorNodeId"] = actorNodeId,
                        ["actorLabel"] = label,
                    },
                });
            }
        }

        return nodes;
    }
}
