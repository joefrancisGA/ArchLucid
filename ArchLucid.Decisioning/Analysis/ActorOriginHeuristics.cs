using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Shared actor trust-origin classification for external-exposure, trust-boundary, and data-flow path engines (DX-03 / DX-32).
/// </summary>
public static class ActorOriginHeuristics
{
    public static bool IsInternalActor(GraphNode actor)
    {
        ArgumentNullException.ThrowIfNull(actor);

        if (!actor.Properties.TryGetValue("trustOrigin", out string? trustOrigin))
        {
            return false;
        }

        return string.Equals(trustOrigin, nameof(TrustOrigin.Internal), StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsExternalFacingActor(GraphNode actor)
    {
        ArgumentNullException.ThrowIfNull(actor);

        if (!actor.Properties.TryGetValue("trustOrigin", out string? trustOrigin))
        {
            return false;
        }

        return string.Equals(trustOrigin, nameof(TrustOrigin.External), StringComparison.OrdinalIgnoreCase)
            || string.Equals(trustOrigin, nameof(TrustOrigin.PublicAnonymous), StringComparison.OrdinalIgnoreCase);
    }
}
