using ArchLucid.Application.Diagrams;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.ArtifactSynthesis.Docx.Models;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Explanation;
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
    public async Task ExportAsync_sanitizes_control_characters_in_document_title()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid manifestId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ManifestDocument manifest = CreateMinimalManifest(runId, manifestId);

        Mock<IImprovementAdvisorService> advisor = CreateAdvisorMock(runId);
        DocxExportService sut = new(advisor.Object, new NullDiagramImageRenderer());
        DocxExportRequest request = CreateMinimalRequest(runId, manifestId);
        request.DocumentTitle = "Architecture\u0001Export";

        DocxExportResult result = await sut.ExportAsync(request, manifest, [], CancellationToken.None);

        string xml = ReadMainDocumentXml(result.Content);
        xml.Should().Contain("ArchitectureExport");
        xml.Should().NotContain("\u0001");
    }

    [Fact]
    public async Task ExportAsync_sanitizes_control_characters_in_effective_governance_provenance_rows()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid manifestId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid packId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ManifestDocument manifest = CreateMinimalManifest(runId, manifestId);
        manifest.EffectiveGovernanceAtCommit = new CommittedEffectiveGovernanceSnapshotDescriptor
        {
            HasEffectivePolicy = true,
            ComplianceRuleKeyCount = 0,
            PackAssignments =
            [
                new CommittedGovernancePackAssignmentSnapshot
                {
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0.0",
                    ScopeLevel = "Tenant",
                },
            ],
            CoverageAssignments =
            [
                new CommittedCoverageAssignmentSnapshot
                {
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0.0",
                    QualityDimension = "Cost\u0001",
                    CoverageType = "QualityDimension",
                    SelectionState = "Included",
                    EvaluationVersion = "1",
                },
            ],
        };

        Mock<IImprovementAdvisorService> advisor = CreateAdvisorMock(runId);
        DocxExportService sut = new(advisor.Object, new NullDiagramImageRenderer());
        DocxExportRequest request = CreateMinimalRequest(runId, manifestId);

        DocxExportResult result = await sut.ExportAsync(request, manifest, [], CancellationToken.None);

        string xml = ReadMainDocumentXml(result.Content);
        xml.Should().Contain("Cost");
        xml.Should().NotContain("\u0001");
    }

    [Fact]
    public async Task ExportAsync_sanitizes_control_characters_in_provenance_manifest_hash_field()
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
            ManifestHash = "golden\u0001hash",
            RuleSetId = "rs",
            RuleSetVersion = "1",
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
        xml.Should().Contain("goldenhash");
        xml.Should().NotContain("\u0001");
    }

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

    [Fact]
    public async Task ExportAsync_labels_empty_cost_risks_without_skipping_the_cost_posture_section()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid manifestId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ManifestDocument manifest = CreateMinimalManifest(runId, manifestId);
        manifest.Cost.CostRisks = [];

        Mock<IImprovementAdvisorService> advisor = CreateAdvisorMock(runId);
        DocxExportService sut = new(advisor.Object, new NullDiagramImageRenderer());
        DocxExportRequest request = CreateMinimalRequest(runId, manifestId);

        DocxExportResult result = await sut.ExportAsync(request, manifest, [], CancellationToken.None);

        string xml = ReadMainDocumentXml(result.Content);
        xml.Should().Contain("Cost risks were stored empty.");
    }

    [Fact]
    public async Task ExportAsync_distinguishes_omitted_and_empty_sponsor_narrative_summary()
    {
        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid manifestId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        ManifestDocument manifest = CreateMinimalManifest(runId, manifestId);

        Mock<IImprovementAdvisorService> advisor = CreateAdvisorMock(runId);
        DocxExportService sut = new(advisor.Object, new NullDiagramImageRenderer());
        DocxExportRequest request = CreateMinimalRequest(runId, manifestId);
        request.RunExplanation = new ExplanationResult { Summary = string.Empty };

        DocxExportResult result = await sut.ExportAsync(request, manifest, [], CancellationToken.None);

        string xml = ReadMainDocumentXml(result.Content);
        xml.Should().Contain("Sponsor narrative summary was stored empty.");
    }

    private static ManifestDocument CreateMinimalManifest(Guid runId, Guid manifestId)
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
            CreatedUtc = new DateTime(2026, 3, 27, 12, 0, 0, DateTimeKind.Utc),
            ManifestHash = "hash",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rule-hash",
            Metadata = new ManifestMetadata
            {
                Name = "Manifest",
                Summary = "Summary",
                Version = "1.0.0",
                Status = "Resolved"
            }
        };
    }

    private static Mock<IImprovementAdvisorService> CreateAdvisorMock(Guid runId)
    {
        Mock<IImprovementAdvisorService> advisor = new();
        advisor
            .Setup(x => x.GeneratePlanAsync(
                It.IsAny<ManifestDocument>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ImprovementPlan { RunId = runId, Recommendations = [], SummaryNotes = [] });

        return advisor;
    }

    private static DocxExportRequest CreateMinimalRequest(Guid runId, Guid manifestId)
    {
        return new DocxExportRequest
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
    }

    private static string ReadMainDocumentXml(byte[] content)
    {
        using MemoryStream stream = new(content);
        using DocumentFormat.OpenXml.Packaging.WordprocessingDocument document =
            DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(stream, false);

        return document.MainDocumentPart!.Document.OuterXml;
    }
}
