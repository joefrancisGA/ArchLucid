using ArchLucid.ArtifactSynthesis.FindingVerification.Models;

namespace ArchLucid.ArtifactSynthesis.FindingVerification;

public interface IFindingVerificationReportExportService
{
    byte[] RenderMarkdown(FindingVerificationReportDocumentModel model);

    byte[] RenderDocx(FindingVerificationReportDocumentModel model);
}
