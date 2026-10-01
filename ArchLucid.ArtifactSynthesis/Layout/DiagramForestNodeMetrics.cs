namespace ArchLucid.ArtifactSynthesis.Layout;

using ArchLucid.ArtifactSynthesis.Models;

public sealed record DiagramForestNodeMetrics(
    double Width,
    double Height,
    IReadOnlyList<string> NameLines,
    string? DataFlowTypeLine,
    string? ConsumerStatusLine,
    IReadOnlyList<string> ResourceGroupLines,
    DiagramNodeHumanCaption Caption,
    DiagramInventoryPictogramKind PictogramKind,
    AzureArchitectureIconCatalogEntry? AzureIcon,
    bool HasPrivateEndpointAccess,
    IReadOnlyList<DiagramNsgInboundRuleChip> NsgInboundRuleChips,
    bool SuppressResourceGroupCaption = false);
