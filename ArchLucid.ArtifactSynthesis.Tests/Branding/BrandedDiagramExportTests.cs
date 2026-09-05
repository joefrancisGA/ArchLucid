using System.Security.Cryptography;
using System.Text;

using ArchLucid.ArtifactSynthesis.Branding;
using ArchLucid.ArtifactSynthesis.Docx.Builders;
using ArchLucid.Core.Manifest.Sections;

using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests.Branding;

[Trait("Category", "Unit")]
[Trait("Suite", "ArtifactSynthesis")]
public sealed class BrandedMermaidSourceDecoratorTests
{
    private const string SampleGraph = """
        flowchart TD
            A[Ingress] --> B[App Service]
            B --> C[(SQL)]
        """;

    [Fact]
    public void Decorate_prepends_title_comment_without_mutating_graph_lines()
    {
        string decorated = BrandedMermaidSourceDecorator.Decorate(SampleGraph, "Fabrikam Holdings");

        decorated.Should().StartWith("%% title: Fabrikam Holdings");
        BrandedMermaidSourceDecorator.StripOptionalTitleComment(decorated).Should().Be(SampleGraph);
    }

    [Fact]
    public void Decorate_without_company_name_returns_source_unchanged()
    {
        BrandedMermaidSourceDecorator.Decorate(SampleGraph, null).Should().Be(SampleGraph);
        BrandedMermaidSourceDecorator.Decorate(SampleGraph, "   ").Should().Be(SampleGraph);
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "ArtifactSynthesis")]
public sealed class BrandedDiagramExportContainerTests
{
    private static readonly byte[] TenantALogo = Encoding.UTF8.GetBytes("tenant-a-logo-bytes");
    private static readonly byte[] TenantBLogo = Encoding.UTF8.GetBytes("tenant-b-logo-bytes");

    private static readonly byte[] SamplePng =
        Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    [Fact]
    public void Wrap_embeds_tenant_logo_checksum_isolated_per_tenant()
    {
        byte[] tenantAChecksum = SHA256.HashData(TenantALogo);
        byte[] tenantBChecksum = SHA256.HashData(TenantBLogo);

        byte[] tenantAContainer = BrandedDiagramExportContainer.Wrap(
            SamplePng,
            "Tenant A Holdings",
            tenantAChecksum);

        byte[] tenantBContainer = BrandedDiagramExportContainer.Wrap(
            SamplePng,
            "Tenant B Holdings",
            tenantBChecksum);

        byte[]? readA = BrandedDiagramExportContainer.TryReadLogoChecksumSha256(tenantAContainer);
        byte[]? readB = BrandedDiagramExportContainer.TryReadLogoChecksumSha256(tenantBContainer);

        readA.Should().NotBeNull().And.BeEquivalentTo(tenantAChecksum);
        readB.Should().NotBeNull().And.BeEquivalentTo(tenantBChecksum);
        readA.Should().NotBeEquivalentTo(readB);
    }

    [Fact]
    public void Wrap_preserves_inner_png_bytes()
    {
        byte[] checksum = SHA256.HashData(TenantALogo);
        byte[] container = BrandedDiagramExportContainer.Wrap(SamplePng, "Fabrikam", checksum);

        BrandedDiagramExportContainer.TryExtractInnerPng(container).Should().BeEquivalentTo(SamplePng);
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "ArtifactSynthesis")]
public sealed class DocxIssueSeverityStylesTests
{
    [Fact]
    public void High_severity_docx_color_unchanged_when_brand_primary_differs()
    {
        const string unrelatedBrandPrimary = "FF5733";

        DocxIssueSeverityStyles.HighSeverityColorHex.Should().Be("C00000");
        unrelatedBrandPrimary.Should().NotBe(DocxIssueSeverityStyles.HighSeverityColorHex);

        using MemoryStream stream = new();
        using (WordprocessingDocument document = WordprocessingDocument.Create(stream, DocumentFormat.OpenXml.WordprocessingDocumentType.Document))
        {
            MainDocumentPart mainPart = document.AddMainDocumentPart();
            mainPart.Document = new Document(new Body());
            Body body = mainPart.Document.Body!;

            WordDocumentBuilder.AddIssuesTable(
                body,
                [new ManifestIssue { Severity = "HIGH", Title = "Open ingress", Description = "Public endpoint" }]);

            document.Save();
        }

        stream.Position = 0;
        using (WordprocessingDocument opened = WordprocessingDocument.Open(stream, false))
        {
            string documentXml = opened.MainDocumentPart!.Document.OuterXml;
            documentXml.Should().Contain($"w:val=\"{DocxIssueSeverityStyles.HighSeverityColorHex}\"");
            documentXml.Should().NotContain(unrelatedBrandPrimary);
        }
    }
}
