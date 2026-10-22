namespace ArchLucid.Decisioning.Analysis;

/// <summary>External actor path to a sensitive datastore that does not cross a trust-boundary or private-endpoint hop.</summary>
public sealed record DataFlowTrustBoundaryPath(
    string ActorNodeId,
    string ActorLabel,
    string DatastoreNodeId,
    string DatastoreLabel,
    int HopCount,
    IReadOnlyList<string> PathNodeIds);
