using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diagrams;
using ArchLucid.Contracts.Manifest;

using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DocxParentManifestVersionTests
{
    [Theory]
    [InlineData(null, "Parent manifest version was not stored.")]
    [InlineData("", "Parent manifest version was stored empty.")]
    [InlineData(" \t ", "Parent manifest version was stored empty.")]
    [InlineData(" v1-parent ", "v1-parent")]
    public async Task Export_distinguishes_missing_blank_and_recorded_parent_versions(string? parentVersion, string expected)
    {
        ArchitectureAnalysisReport report = new()
        {
            Manifest = new GoldenManifest
            {
                Metadata = new ManifestMetadata { ManifestVersion = "v2", ParentManifestVersion = parentVersion },
            },
        };

        var exporter = new DocxArchitectureAnalysisExportService(new NullDiagramImageRenderer());
        byte[] bytes = await exporter.GenerateDocxAsync(report);

        using MemoryStream stream = new(bytes);
        using WordprocessingDocument docx = WordprocessingDocument.Open(stream, false);
        const string label = "Parent Manifest Version: ";
        docx.MainDocumentPart!.Document.Body!.Elements<Paragraph>()
            .Select(paragraph => paragraph.InnerText)
            .Where(text => text.StartsWith(label, StringComparison.Ordinal))
            .Should().Equal(label + expected);
    }
}
