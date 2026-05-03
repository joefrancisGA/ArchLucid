namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Represents a source citation for an AI-generated finding, linking it to a specific policy, best practice, or evidence item.
/// </summary>
public sealed class Citation
{
    /// <summary>The identifier of the source (e.g., policy ID, document ID).</summary>
    public string SourceId { get; set; } = string.Empty;

    /// <summary>A human-readable description or excerpt from the source.</summary>
    public string Description { get; set; } = string.Empty;
}
