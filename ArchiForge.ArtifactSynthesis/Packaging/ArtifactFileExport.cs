namespace ArchiForge.ArtifactSynthesis.Packaging;

public class ArtifactFileExport
{
    public string FileName { get; set; } = default!;
    public string ContentType { get; set; } = default!;
    public byte[] Content { get; set; } = Array.Empty<byte>();
}
