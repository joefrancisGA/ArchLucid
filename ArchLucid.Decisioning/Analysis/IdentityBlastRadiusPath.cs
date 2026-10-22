namespace ArchLucid.Decisioning.Analysis;

/// <summary>One machine-actor path to a regulated datastore through a write/admin role assignment.</summary>
public sealed record IdentityBlastRadiusPath(
    string ActorNodeId,
    string ActorLabel,
    string DatastoreNodeId,
    string DatastoreLabel,
    string RoleName,
    int HopCount,
    IReadOnlyList<string> PathNodeIds);
