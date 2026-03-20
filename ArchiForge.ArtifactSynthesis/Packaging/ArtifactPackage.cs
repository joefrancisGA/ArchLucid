namespace ArchiForge.ArtifactSynthesis.Packaging;

public class ArtifactPackage
{
    public string PackageFileName { get; set; } = default!;
    public string ContentType { get; set; } = "application/zip";
    public byte[] Content { get; set; } = Array.Empty<byte>();
}
