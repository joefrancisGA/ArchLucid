using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;

using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ConsultingDocxExportHonestyCopyTests
{
    [Fact]
    public void ResolveSystemName_uses_omission_copy_when_missing()
    {
        ConsultingDocxExportHonestyCopy.ResolveSystemName(null, null)
            .Should()
            .Be(ConsultingDocxExportHonestyCopy.SystemNameNotStored);
    }

    [Fact]
    public void ResolveSystemName_prefers_evidence_over_manifest()
    {
        ConsultingDocxExportHonestyCopy.ResolveSystemName("Evidence name", "Manifest name")
            .Should()
            .Be("Evidence name");
    }

    [Fact]
    public void ResolveRequestId_and_manifest_version_use_omission_copy()
    {
        ConsultingDocxExportHonestyCopy.ResolveRequestId("  ")
            .Should()
            .Be(ConsultingDocxExportHonestyCopy.RequestIdNotStored);

        ConsultingDocxExportHonestyCopy.ResolveManifestVersionLabel(null)
            .Should()
            .Be(ConsultingDocxExportHonestyCopy.ManifestVersionNotStored);
    }

    [Fact]
    public async Task CoverPageBuilder_uses_system_name_and_manifest_version_honesty()
    {
        using MemoryStream stream = new();
        using DocumentFormat.OpenXml.Packaging.WordprocessingDocument document =
            DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Create(
                stream,
                DocumentFormat.OpenXml.WordprocessingDocumentType.Document,
                true);
        DocumentFormat.OpenXml.Packaging.MainDocumentPart mainPart = document.AddMainDocumentPart();
        mainPart.Document = new DocumentFormat.OpenXml.Wordprocessing.Document(
            new DocumentFormat.OpenXml.Wordprocessing.Body());
        DocumentFormat.OpenXml.Wordprocessing.Body body = mainPart.Document.Body!;
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun { RunId = "run-1", RequestId = "  " },
        };

        await ConsultingDocxCoverPageBuilder.AddAsync(
            mainPart,
            body,
            report,
            new ConsultingDocxTemplateOptions(),
            Mock.Of<IDocumentLogoProvider>(),
            branding: null,
            careerExportHonesty: null,
            CancellationToken.None);

        body.InnerText.Should().Contain(ConsultingDocxExportHonestyCopy.SystemNameNotStored);
        body.InnerText.Should().Contain(ConsultingDocxExportHonestyCopy.RequestIdNotStored);
        body.InnerText.Should().Contain(ConsultingDocxExportHonestyCopy.ManifestVersionNotStored);
    }
}
