namespace ArchLucid.ArtifactSynthesis.Layout;

public sealed record DiagramForestNodeMetrics(
    double Width,
    double Height,
    IReadOnlyList<string> NameLines,
    string? ConsumerStatusLine,
    IReadOnlyList<string> ResourceGroupLines,
    DiagramNodeHumanCaption Caption,
    DiagramInventoryPictogramKind PictogramKind,
    AzureArchitectureIconCatalogEntry? AzureIcon,
    bool HasPrivateEndpointAccess,
    bool SuppressResourceGroupCaption = false);
