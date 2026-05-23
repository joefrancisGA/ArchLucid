using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Mapping;

/// <summary>
///     Maps a single <see cref="ContextIngestion.Models.CanonicalObject" /> to a typed <see cref="Models.GraphNode" />.
/// </summary>
public interface IGraphNodeFactory
{
    GraphNode CreateNode(CanonicalObject item);
}
