namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Human-readable inventory node caption. AST <c>Label</c> stays the resource name.</summary>
public sealed record DiagramNodeHumanCaption(
    string ResourceName,
    string? TypeCaption,
    string CombinedPlainText,
    string AccessibilityTitle);
