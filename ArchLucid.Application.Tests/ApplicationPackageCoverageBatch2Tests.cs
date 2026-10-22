using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Determinism;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ApplicationPackageCoverageBatch2Tests
{
    [Fact]
    public void DeterminismVersionConstants_exposes_baseline_and_iteration_versions()
    {
        DeterminismVersionConstants.BaselineVersion.Should().Be("determinism-baseline");
        DeterminismVersionConstants.IterationVersion(2).Should().Be("determinism-2");
    }

    [Fact]
    public void ConflictException_constructors_preserve_message_and_inner()
    {
        InvalidOperationException inner = new("inner");
        ConflictException sut = new("conflict", inner);

        sut.Message.Should().Be("conflict");
        sut.InnerException.Should().BeSameAs(inner);
    }

    [Fact]
    public void DiagramIdSanitizer_normalizes_special_characters_and_digit_prefix()
    {
        DiagramIdSanitizer.Sanitize("  ").Should().Be("node_unknown");
        DiagramIdSanitizer.Sanitize("svc-1").Should().Be("svc_1");
        DiagramIdSanitizer.Sanitize("1service").Should().Be("n_1service");
    }

    [Fact]
    public void DefaultConsultingDocxTemplateProfileResolver_returns_four_profiles()
    {
        DefaultConsultingDocxTemplateProfileResolver sut = new();

        ConsultingDocxTemplateProfileCatalog catalog = sut.GetCatalog();

        catalog.Profiles.Should().HaveCount(4);
        catalog.Profiles.Select(p => p.ProfileName).Should().Contain(ConsultingDocxProfiles.Sponsor);
    }

    [Theory]
    [InlineData(true, false, false, false, false, null, ConsultingDocxProfiles.Regulated)]
    [InlineData(false, true, false, false, false, null, ConsultingDocxProfiles.Sponsor)]
    [InlineData(false, false, true, false, false, null, ConsultingDocxProfiles.Client)]
    [InlineData(false, false, false, true, false, null, ConsultingDocxProfiles.Internal)]
    [InlineData(false, false, false, false, false, "Sponsor sponsors", ConsultingDocxProfiles.Sponsor)]
    [InlineData(false, false, false, false, false, "audit committee", ConsultingDocxProfiles.Regulated)]
    [InlineData(false, false, false, false, false, "external client", ConsultingDocxProfiles.Client)]
    public void ConsultingDocxTemplateRecommendationService_selects_expected_profile(
        bool regulated,
        bool executiveFriendly,
        bool externalDelivery,
        bool needDetailedEvidence,
        bool needTraces,
        string? audience,
        string expectedProfile)
    {
        ConsultingDocxTemplateRecommendationService sut =
            new(new DefaultConsultingDocxTemplateProfileResolver());
        ConsultingDocxProfileRecommendationRequest request = new()
        {
            RegulatedEnvironment = regulated,
            ExecutiveFriendly = executiveFriendly,
            ExternalDelivery = externalDelivery,
            NeedDetailedEvidence = needDetailedEvidence,
            NeedExecutionTraces = needTraces,
            Audience = audience,
        };

        ConsultingDocxProfileRecommendation recommendation = sut.Recommend(request);

        recommendation.RecommendedProfileName.Should().Be(expectedProfile);
        recommendation.Reason.Should().NotBeNullOrWhiteSpace();
        recommendation.AlternativeProfiles.Should().NotBeEmpty();
    }

    [Fact]
    public void ConsultingDocxTemplateRecommendationService_throws_when_catalog_empty()
    {
        MockConsultingDocxTemplateProfileResolver emptyResolver = new();
        ConsultingDocxTemplateRecommendationService sut = new(emptyResolver);

        Action act = () => sut.Recommend(new ConsultingDocxProfileRecommendationRequest());

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void ComparisonDriftReportExportService_formats_markdown_with_items_and_record_id()
    {
        ComparisonDriftReportExportService sut = new();
        DriftAnalysisResult drift = new()
        {
            DriftDetected = true,
            Summary = "Two differences found.",
            Items =
            [
                new DriftItem
                {
                    Category = "ValueChange",
                    Path = "$.field",
                    Description = "Changed",
                    StoredValue = "a",
                    RegeneratedValue = "b",
                },
            ],
        };

        string markdown = sut.GenerateMarkdown(drift, comparisonRecordId: "rec-1");

        markdown.Should().Contain("Comparison Drift Report");
        markdown.Should().Contain("rec-1");
        markdown.Should().Contain("ValueChange");
        markdown.Should().Contain("Stored: `a`");
    }

    [Fact]
    public void ComparisonDriftReportExportService_generate_docx_returns_non_empty_bytes()
    {
        ComparisonDriftReportExportService sut = new();
        DriftAnalysisResult drift = new()
        {
            DriftDetected = false,
            Summary = "No drift detected.",
        };

        byte[] docx = sut.GenerateDocx(drift);

        docx.Should().NotBeEmpty();
    }

    [Fact]
    public async Task ExportRecordDiffExportService_generate_docx_includes_changed_fields()
    {
        ExportRecordDiffExportService sut = new();
        ExportRecordDiffResult diff = new()
        {
            LeftExportRecordId = "left",
            RightExportRecordId = "right",
            LeftRunId = "run-left",
            RightRunId = "run-right",
            ChangedTopLevelFields = ["Format"],
            RequestDiff = new ExportRecordRequestDiff
            {
                ChangedFlags = ["IncludeManifest"],
                ChangedValues = ["TemplateProfile"],
            },
            Warnings = ["warning"],
        };

        byte[] docx = await sut.GenerateDocxAsync(diff, CancellationToken.None);

        docx.Should().NotBeEmpty();
    }

    [Fact]
    public void ExportRecordDiffService_compare_detects_top_level_and_request_changes()
    {
        ExportRecordDiffService sut = new();
        RunExportRecord left = new()
        {
            ExportRecordId = "left",
            RunId = "run-a",
            ExportType = "ArchitectureAnalysis",
            Format = "Markdown",
            FileName = "a.md",
            AnalysisRequestJson = """{"includeManifest":true}""",
        };
        RunExportRecord right = new()
        {
            ExportRecordId = "right",
            RunId = "run-b",
            ExportType = "ArchitectureAnalysis",
            Format = "Docx",
            FileName = "b.docx",
            AnalysisRequestJson = """{"includeManifest":false}""",
        };

        ExportRecordDiffResult result = sut.Compare(left, right);

        result.ChangedTopLevelFields.Should().Contain("Format");
        result.Warnings.Should().Contain(w => w.Contains("different runs", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void MarkdownManifestDiffExportService_emits_snapshot_metadata()
    {
        MarkdownManifestDiffExportService sut = new();
        GoldenManifest left = new()
        {
            RunId = "left-run",
            SystemName = "Left",
            Metadata = new ManifestMetadata { ManifestVersion = "v1" },
        };
        GoldenManifest right = new()
        {
            RunId = "right-run",
            SystemName = "Right",
            Metadata = new ManifestMetadata { ManifestVersion = "v2" },
        };
        ManifestDiffResult diff = new() { LeftManifestVersion = "v1", RightManifestVersion = "v2" };

        string markdown = sut.GenerateMarkdownExport(left, right, diff, "# Summary");

        markdown.Should().Contain("Left Manifest Snapshot");
        markdown.Should().Contain("right-run");
        markdown.Should().Contain("# Summary");
    }

    [Fact]
    public void MarkdownEndToEndReplayComparisonSummaryFormatter_lists_material_changes()
    {
        MarkdownEndToEndReplayComparisonSummaryFormatter sut = new();
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            RunDiff = new RunMetadataDiffResult { ChangedFields = ["Status"] },
            AgentResultDiff = new AgentResultDiffResult
            {
                AgentDeltas =
                [
                    new AgentResultDelta
                    {
                        AgentType = AgentType.Topology,
                        AddedFindings = ["finding-1"],
                    },
                ],
            },
            ManifestDiff = new ManifestDiffResult { AddedServices = ["api"] },
            ExportDiffs =
            [
                new ExportRecordDiffResult
                {
                    LeftExportRecordId = "l",
                    RightExportRecordId = "r",
                    ChangedTopLevelFields = ["Format"],
                    RequestDiff = new ExportRecordRequestDiff { ChangedFlags = ["IncludeManifest"] },
                },
            ],
        };

        string markdown = sut.FormatMarkdown(report);

        markdown.Should().Contain("left -> right");
        markdown.Should().Contain("Run Metadata Changes");
        markdown.Should().Contain("Topology");
        markdown.Should().Contain("Export Diff Summary");
    }

    [Fact]
    public void MarkdownEndToEndReplayComparisonSummaryFormatter_includes_datastore_and_relationship_manifest_diffs()
    {
        MarkdownEndToEndReplayComparisonSummaryFormatter sut = new();
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = "left",
            RightRunId = "right",
            ManifestDiff = new ManifestDiffResult
            {
                AddedDatastores = ["orders-db"],
                RemovedDatastores = ["legacy-db"],
                AddedRelationships =
                [
                    new RelationshipDiffItem { SourceId = "api", TargetId = "orders-db", RelationshipType = "reads" },
                ],
                RemovedRelationships =
                [
                    new RelationshipDiffItem { SourceId = "api", TargetId = "legacy-db", RelationshipType = "reads" },
                ],
            },
        };

        string markdown = sut.FormatMarkdown(report);

        markdown.Should().Contain("## Manifest Added Datastores");
        markdown.Should().Contain("orders-db");
        markdown.Should().Contain("## Manifest Removed Datastores");
        markdown.Should().Contain("legacy-db");
        markdown.Should().Contain("## Manifest Added Relationships");
        markdown.Should().Contain("api -> orders-db (reads)");
        markdown.Should().Contain("## Manifest Removed Relationships");
        markdown.Should().Contain("api -> legacy-db (reads)");
    }

    [Fact]
    public void MarkdownEvidenceSummaryFormatter_emits_request_policy_and_notes_sections()
    {
        MarkdownEvidenceSummaryFormatter sut = new();
        AgentEvidencePackage evidence = new()
        {
            SystemName = "Payments",
            Environment = "prod",
            CloudProvider = "Azure",
            Request = new RequestEvidence
            {
                Description = "Modernize payments",
                Constraints = ["PCI"],
                RequiredCapabilities = ["HA"],
                Assumptions = ["Single region"],
            },
            Policies =
            [
                new PolicyEvidence
                {
                    Title = "Baseline",
                    PolicyId = "pol-1",
                    Summary = "Summary",
                    RequiredControls = ["encrypt"],
                },
            ],
            Notes =
            [
                new EvidenceNote { NoteType = "hint", Message = "note-1" },
            ],
        };

        string markdown = sut.FormatMarkdown(evidence);

        markdown.Should().Contain("Payments");
        markdown.Should().Contain("Policy Evidence");
        markdown.Should().Contain("Evidence Notes");
    }

    [Fact]
    public void MermaidDiagramGenerator_emits_services_datastores_and_relationships()
    {
        MermaidDiagramGenerator sut = new();
        GoldenManifest manifest = new()
        {
            SystemName = "Sys",
            Services =
            [
                new ManifestService
                {
                    ServiceId = "svc-1",
                    ServiceName = "API",
                    RuntimePlatform = RuntimePlatform.Aks,
                },
            ],
            Datastores =
            [
                new ManifestDatastore
                {
                    DatastoreId = "db-1",
                    DatastoreName = "SQL",
                    RuntimePlatform = RuntimePlatform.SqlServer,
                    PrivateEndpointRequired = true,
                },
            ],
            Relationships =
            [
                new ManifestRelationship
                {
                    SourceId = "svc-1",
                    TargetId = "db-1",
                    RelationshipType = RelationshipType.ReadsFrom,
                },
            ],
        };

        string mermaid = sut.GenerateMermaid(manifest);

        mermaid.Should().StartWith("flowchart LR");
        mermaid.Should().Contain("svc_1");
        mermaid.Should().Contain("db_1");
        mermaid.Should().Contain("-->");
    }

    private sealed class MockConsultingDocxTemplateProfileResolver : IConsultingDocxTemplateProfileResolver
    {
        public ConsultingDocxTemplateProfileCatalog GetCatalog() =>
            new() { Profiles = [] };
    }
}
