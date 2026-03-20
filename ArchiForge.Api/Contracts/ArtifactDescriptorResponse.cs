namespace ArchiForge.Api.Contracts;

public sealed class ArtifactDescriptorResponse
{
    public Guid ArtifactId { get; set; }
    public string ArtifactType { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string Format { get; set; } = default!;
    public DateTime CreatedUtc { get; set; }
    public string ContentHash { get; set; } = default!;
}
