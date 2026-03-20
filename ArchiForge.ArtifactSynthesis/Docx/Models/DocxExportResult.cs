namespace ArchiForge.ArtifactSynthesis.Docx.Models;

public class DocxExportResult
{
    public string FileName { get; set; } = default!;
    public byte[] Content { get; set; } = [];
    public string ContentType { get; set; } = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}
