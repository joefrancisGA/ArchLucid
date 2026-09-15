namespace ArchLucid.ArtifactSynthesis.Layout;

public sealed record DiagramForestNodeMetrics(
    double Width,
    double Height,
    IReadOnlyList<string> NameLines,
    IReadOnlyList<string> ResourceGroupLines,
    DiagramNodeHumanCaption Caption,
    DiagramInventoryPictogramKind PictogramKind,
    bool HasPrivateEndpointAccess);
