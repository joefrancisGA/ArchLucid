using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Bounds for VNet and subnet containers drawn inside resource-group frames.</summary>
public sealed record DiagramForestNestedFrameBounds(
    string Kind,
    string Label,
    string FrameId,
    double X,
    double Y,
    double Width,
    double Height);
