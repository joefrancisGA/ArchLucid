using ArchLucid.ArtifactSynthesis.FindingVerification.Models;

namespace ArchLucid.ArtifactSynthesis.FindingVerification;

public sealed class FindingVerificationReportExportService : IFindingVerificationReportExportService
{
    public byte[] RenderMarkdown(FindingVerificationReportDocumentModel model)
    {
        string markdown = FindingVerificationReportMarkdownRenderer.Render(model);
        return System.Text.Encoding.UTF8.GetBytes(markdown);
    }

    public byte[] RenderDocx(FindingVerificationReportDocumentModel model) =>
        FindingVerificationReportDocxRenderer.Render(model);
}
