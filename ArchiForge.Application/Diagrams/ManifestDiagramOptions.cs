namespace ArchiForge.Application.Diagrams;

public sealed class ManifestDiagramOptions
{
    /// <summary>Mermaid flowchart layout direction: LR (default) or TB.</summary>
    public string Layout { get; set; } = "LR";

    /// <summary>When true, include RuntimePlatform in node labels.</summary>
    public bool IncludeRuntimePlatform { get; set; } = true;

    /// <summary>Relationship label mode: type (default) or none.</summary>
    public string RelationshipLabels { get; set; } = "type";

    /// <summary>Optional grouping mode: none (default), runtimePlatform, serviceType.</summary>
    public string GroupBy { get; set; } = "none";
}

