namespace ArchLucid.ArtifactSynthesis.Layout;

public sealed record DiagramForestNodeMetrics(
    double Width,
    double Height,
    IReadOnlyList<string> NameLines,
    DiagramNodeHumanCaption Caption,
    DiagramInventoryPictogramKind PictogramKind);
