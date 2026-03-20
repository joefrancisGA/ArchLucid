using ArchiForge.ArtifactSynthesis.Docx.Models;
using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.Decisioning.Models;

namespace ArchiForge.ArtifactSynthesis.Docx;

public interface IDocxExportService
{
    Task<DocxExportResult> ExportAsync(
        DocxExportRequest request,
        GoldenManifest manifest,
        IReadOnlyList<SynthesizedArtifact> artifacts,
        CancellationToken ct);
}
