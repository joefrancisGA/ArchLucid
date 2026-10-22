namespace ArchLucid.Api.Models;

/// <summary>Hop-depth bounds for provenance graph neighbourhood queries.</summary>
public static class ProvenanceQueryLimits
{
    /// <summary>Max depth for <c>GET /v1/provenance/runs/{{runId}}/graph/node/{{nodeId}}</c> (UI alias route).</summary>
    public const int MaxNeighborhoodDepthProvenanceRoute = 5;

    /// <summary>Max depth for <c>GET /v1/authority/runs/{{runId}}/graph/node/{{nodeId}}</c> (authority read path).</summary>
    public const int MaxNeighborhoodDepthAuthorityRoute = 10;
}
