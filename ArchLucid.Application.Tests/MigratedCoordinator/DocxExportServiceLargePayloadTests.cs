using ArchLucid.Application.Diagrams;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Docx.Models;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Diagrams;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Advisory.Models;
using ArchLucid.Decisioning.Advisory.Services;
using ArchLucid.Decisioning.Models;

using DocumentFormat.OpenXml.Packaging;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.MigratedCoordinator;

/// <summary>
///     Stress-style checks for <see cref="DocxExportService" />: large text and wide tables should complete without
///     throwing (bounded OpenXML expansion, single buffer materialization at end).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Category", "Slow")]
public sealed class DocxExportServiceLargePayloadTests
{
    private const int LargeSummaryCharCount = 55_000;
    private const int RequirementRowCount = 350;

    [SkippableFact]
    public async Task ExportAsync_large_executive_summary_produces_non_empty_docx()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid manifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        ManifestDocument manifest = MinimalManifest(runId, manifestId);
        manifest.Metadata.Summary = new string('s', LargeSummaryCharCount) + "TAIL";

        Mock<IImprovementAdvisorService> advisor = new();
        advisor
            .Setup(x => x.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImprovementPlan { RunId = runId, Recommendations = [], SummaryNotes = [] });

        DocxExportService sut = new(advisor.Object, new NullDiagramImageRenderer());
        DocxExportRequest request = MinimalRequest(runId, manifestId);

        DocxExportResult result = await sut.ExportAsync(request, manifest, [], CancellationToken.None);

        result.Content.Should().NotBeNullOrEmpty();

        using MemoryStream wordStream = new(result.Content);
        using WordprocessingDocument wordDoc = WordprocessingDocument.Open(wordStream, false);
        MainDocumentPart? main = wordDoc.MainDocumentPart;
        main.Should().NotBeNull();
        string xml = main.Document.OuterXml;

        xml.Should().Contain("TAIL");
        xml.Length.Should().BeGreaterThan(LargeSummaryCharCount);
    }

    [SkippableFact]
    public async Task ExportAsync_many_requirement_rows_produces_non_empty_docx()
    {
        Guid runId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid manifestId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        ManifestDocument manifest = MinimalManifest(runId, manifestId);
        for (int i = 0; i < RequirementRowCount; i++)
        {
            manifest.Requirements.Covered.Add(new RequirementCoverageItem
            {
                RequirementName = $"REQ-{i}",
                RequirementText = "Sample requirement text for row fill.",
                IsMandatory = i % 2 == 0,
                CoverageStatus = "Met"
            });
        }

        Mock<IImprovementAdvisorService> advisor = new();
        advisor
            .Setup(x => x.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImprovementPlan { RunId = runId, Recommendations = [], SummaryNotes = [] });

        DocxExportService sut = new(advisor.Object, new NullDiagramImageRenderer());
        DocxExportRequest request = MinimalRequest(runId, manifestId);
        request.IncludeCoverageSection = true;

        DocxExportResult result = await sut.ExportAsync(request, manifest, [], CancellationToken.None);

        result.Content.Should().NotBeNullOrEmpty();

        using MemoryStream wordStream = new(result.Content);
        using WordprocessingDocument wordDoc = WordprocessingDocument.Open(wordStream, false);
        MainDocumentPart? main = wordDoc.MainDocumentPart;
        main.Should().NotBeNull();
        string xml = main.Document.OuterXml;

        xml.Should().Contain("REQ-0");
        xml.Should().Contain($"REQ-{RequirementRowCount - 1}");
        xml.Should().Contain("Requirements Coverage");
    }

    private static DocxExportRequest MinimalRequest(Guid runId, Guid manifestId)
    {
        return new DocxExportRequest
        {
            RunId = runId,
            ManifestId = manifestId,
            DocumentTitle = "Large Payload Export",
            Subtitle = "stress",
            IncludeArchitectureDiagram = false,
            IncludeArtifactsAppendix = false,
            IncludeComplianceSection = false,
            IncludeCoverageSection = false,
            IncludeIssuesSection = false
        };
    }

    private static ManifestDocument MinimalManifest(Guid runId, Guid manifestId)
    {
        return new ManifestDocument
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
            CreatedUtc = new DateTime(2026, 5, 14, 0, 0, 0, DateTimeKind.Utc),
            ManifestHash = "large-payload-hash",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
            Metadata = new ManifestMetadata
            {
                Name = "Large manifest",
                Summary = "seed",
                Version = "1.0.0",
                Status = "Resolved"
            }
        };
    }
}
