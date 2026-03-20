namespace ArchiForge.ArtifactSynthesis.Docx.Models;

public class DocxExportRequest
{
    public Guid RunId { get; set; }
    public Guid ManifestId { get; set; }

    public string DocumentTitle { get; set; } = "ArchiForge Architecture Package";
    public string Subtitle { get; set; } = "Generated Architecture Document";

    public bool IncludeArtifactsAppendix { get; set; } = true;
    public bool IncludeComplianceSection { get; set; } = true;
    public bool IncludeCoverageSection { get; set; } = true;
    public bool IncludeIssuesSection { get; set; } = true;
}
