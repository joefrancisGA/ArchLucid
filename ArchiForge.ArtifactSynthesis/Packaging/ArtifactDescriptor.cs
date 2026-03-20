namespace ArchiForge.ArtifactSynthesis.Packaging;

public class ArtifactDescriptor
{
    public Guid ArtifactId { get; set; }
    public string ArtifactType { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string Format { get; set; } = default!;
    public DateTime CreatedUtc { get; set; }
    public string ContentHash { get; set; } = default!;
}
