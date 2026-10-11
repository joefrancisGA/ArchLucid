using ArchLucid.Application.Diagrams;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Docx.Models;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Advisory.Models;
using ArchLucid.Decisioning.Advisory.Services;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.MigratedCoordinator;

[Trait("Category", "Unit")]
[Trait("Suite", "ArtifactSynthesis")]
public sealed class DocxExportServiceProvenanceTests
{
    [Fact]
    public async Task ExportAsync_sanitizes_control_characters_in_provenance_rule_set_fields()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid manifestId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ManifestDocument manifest = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            CreatedUtc = new DateTime(2026, 3, 27, 12, 0, 0, DateTimeKind.Utc),
            ManifestHash = "hash",
            RuleSetId = "rules\u0001id",
            RuleSetVersion = "version\u0002",
            RuleSetHash = "rule-hash",
            Metadata = new ManifestMetadata
            {
                Name = "Manifest",
                Summary = "Summary",
                Version = "1.0.0",
                Status = "Resolved"
            }
        };

        Mock<IImprovementAdvisorService> advisor = new();
        advisor
            .Setup(x => x.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImprovementPlan { RunId = runId, Recommendations = [], SummaryNotes = [] });

        DocxExportService sut = new(advisor.Object, new NullDiagramImageRenderer());
        DocxExportRequest request = new()
        {
            RunId = runId,
            ManifestId = manifestId,
            DocumentTitle = "Architecture Export",
            Subtitle = "Subtitle",
            IncludeArchitectureDiagram = false,
            IncludeArtifactsAppendix = false,
            IncludeComplianceSection = false,
            IncludeCoverageSection = false,
            IncludeIssuesSection = false
        };

        DocxExportResult result = await sut.ExportAsync(request, manifest, [], CancellationToken.None);

        string xml = ReadMainDocumentXml(result.Content);
        xml.Should().Contain("rulesid version");
        xml.Should().NotContain("\u0001");
        xml.Should().NotContain("\u0002");
    }

    private static string ReadMainDocumentXml(byte[] content)
    {
        using MemoryStream stream = new(content);
        using DocumentFormat.OpenXml.Packaging.WordprocessingDocument document =
            DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(stream, false);

        return document.MainDocumentPart!.Document.OuterXml;
    }
}
