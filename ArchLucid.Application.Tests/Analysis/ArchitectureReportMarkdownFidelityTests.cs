using ArchLucid.Application.Analysis;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureReportMarkdownFidelityTests
{
    private static readonly DateTime CreatedUtc = new(2026, 1, 5, 9, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Completed_run_header_preserves_distinct_run_request_version_and_timestamps()
    {
        ArchitectureAnalysisReport report = new()
        {
            Run = new ArchitectureRun
            {
                RunId = "run-123",
                RequestId = "request-456",
                CurrentManifestVersion = "manifest-v7",
                Status = ArchitectureRunStatus.Committed,
                CreatedUtc = CreatedUtc,
                CompletedUtc = CreatedUtc.AddMinutes(10),
            },
        };

        Lines(Report(report)).Should().ContainInOrder(
            "- Run ID: run-123",
            "- Request ID: request-456",
            "- Run Status: Committed",
            "- Created UTC: 2026-01-05T09:00:00.0000000Z",
            "- Completed UTC: 2026-01-05T09:10:00.0000000Z",
            "- Current Manifest Version: manifest-v7");
    }

    [Fact]
    public void Report_keeps_blank_warning_distinct_from_missing_warnings()
    {
        ArchitectureAnalysisReport report = new() { Warnings = ["", "Review the topology notes."] };

        Lines(Report(report)).Should().ContainInOrder(
            "## Report Warnings",
            "- Warning text was stored empty.",
            "- Review the topology notes.");
        Lines(Report(new ArchitectureAnalysisReport())).Should().NotContain("## Report Warnings");
    }

    [Fact]
    public void Manifest_narrative_counts_distinct_collection_sizes_and_orders_rows_by_name()
    {
        GoldenManifest manifest = new()
        {
            SystemName = "Orders",
            Services =
            [
                new ManifestService { ServiceId = "worker", ServiceName = "Zebra worker" },
                new ManifestService { ServiceId = "api", ServiceName = "Alpha API" },
            ],
            Datastores =
            [
                new ManifestDatastore { DatastoreId = "backup", DatastoreName = "Zebra backup" },
                new ManifestDatastore { DatastoreId = "db", DatastoreName = "Alpha ledger" },
                new ManifestDatastore { DatastoreId = "warehouse", DatastoreName = "Middle warehouse" },
            ],
            Relationships =
            [
                new ManifestRelationship { SourceId = "api", TargetId = "db", RelationshipType = RelationshipType.WritesTo },
            ],
        };

        Lines(Summary(manifest)).Should().ContainInOrder(
            "Orders is represented by a GoldenManifest containing 2 service(s), 3 datastore(s), and 1 relationship(s).",
            "## Services", "- **Alpha API**", "- **Zebra worker**",
            "## Datastores", "- **Alpha ledger**", "- **Middle warehouse**", "- **Zebra backup**");
    }

    [Fact]
    public void Service_narrative_does_not_conflate_purpose_controls_and_tags()
    {
        GoldenManifest manifest = new()
        {
            Services =
            [
                new ManifestService
                {
                    ServiceName = "Orders API",
                    Purpose = " ",
                    RequiredControls = ["log-retention"],
                    Tags = ["commerce"],
                },
            ],
        };

        Lines(Summary(manifest)).Should().ContainInOrder(
            "- **Orders API**",
            "- Purpose: Purpose was not recorded.",
            "- Required Controls: log-retention",
            "- Tags: commerce");
    }

    [Fact]
    public void Manifest_lineage_distinguishes_saved_blanks_from_missing_values()
    {
        GoldenManifest manifest = new()
        {
            Metadata = new ManifestMetadata { ParentManifestVersion = null, ChangeDescription = null! },
        };

        Lines(Summary(manifest)).Should().ContainInOrder(
            "- Parent Manifest Version: Parent manifest version was not stored.",
            "- Change Description: Change description was not stored.");
        manifest.Metadata.ParentManifestVersion = " ";
        manifest.Metadata.ChangeDescription = " ";
        Lines(Summary(manifest)).Should().ContainInOrder(
            "- Parent Manifest Version: Parent manifest version was stored empty.",
            "- Change Description: Change description was stored empty.");
    }

    [Fact]
    public void Request_facts_appear_only_under_their_own_subheading()
    {
        ArchitectureAnalysisReport report = new()
        {
            Evidence = new AgentEvidencePackage
            {
                Request = new RequestEvidence
                {
                    Constraints = ["Keep existing storage."],
                    RequiredCapabilities = ["Support order lookup."],
                    Assumptions = ["Order volumes stay level."],
                },
            },
        };
        string[] lines = Lines(Report(report));
        int start = Array.IndexOf(lines, "- Constraints:");
        int end = Array.IndexOf(lines, "### Policy Evidence");

        start.Should().BeGreaterThanOrEqualTo(0);
        end.Should().BeGreaterThan(start);
        lines[start..end].Should().Equal(
            "- Constraints:", "- Keep existing storage.",
            "- Required Capabilities:", "- Support order lookup.",
            "- Assumptions:", "- Order volumes stay level.");
    }

    [Fact]
    public void Evidence_reference_lists_sort_by_display_name_in_each_section()
    {
        ArchitectureAnalysisReport report = new()
        {
            Evidence = new AgentEvidencePackage
            {
                Policies = [new PolicyEvidence { Title = "Zebra policy" }, new PolicyEvidence { Title = "Alpha policy" }],
                ServiceCatalog =
                [
                    new ServiceCatalogEvidence { ServiceName = "Zebra catalog" },
                    new ServiceCatalogEvidence { ServiceName = "Alpha catalog" },
                ],
                Patterns = [new PatternEvidence { Name = "Zebra pattern" }, new PatternEvidence { Name = "Alpha pattern" }],
            },
        };

        Lines(Report(report)).Should().ContainInOrder(
            "### Policy Evidence", "- **Alpha policy**", "- **Zebra policy**",
            "### Service Catalog Hints", "- **Alpha catalog**", "- **Zebra catalog**",
            "### Pattern Hints", "- **Alpha pattern**", "- **Zebra pattern**");
    }

    [Fact]
    public void Traces_from_the_same_agent_render_in_chronological_order_not_id_order()
    {
        ArchitectureAnalysisReport report = new()
        {
            ExecutionTraces =
            [
                new AgentExecutionTrace { AgentType = AgentType.Topology, TraceId = "a-late", CreatedUtc = CreatedUtc.AddMinutes(1) },
                new AgentExecutionTrace { AgentType = AgentType.Topology, TraceId = "z-early", CreatedUtc = CreatedUtc },
            ],
        };

        Lines(Report(report)).Where(line => line.StartsWith("- Trace ID:", StringComparison.Ordinal))
            .Should().Equal("- Trace ID: z-early", "- Trace ID: a-late");
    }

    [Fact]
    public void Stored_empty_trace_list_is_distinct_from_a_missing_list()
    {
        Lines(Report(new ArchitectureAnalysisReport()))
            .Should().Contain("- Execution traces were not stored for this run.");

        Lines(Report(new ArchitectureAnalysisReport { ExecutionTraces = [] }))
            .Should().Contain("- Execution traces were stored as an empty list for this run.");
    }

    private static string Report(ArchitectureAnalysisReport report) =>
        new MarkdownArchitectureAnalysisExportService().GenerateMarkdown(report);

    private static string Summary(GoldenManifest manifest) =>
        new MarkdownManifestSummaryGenerator(Mock.Of<IEvidenceSummaryFormatter>()).GenerateMarkdown(manifest);

    private static string[] Lines(string markdown) =>
        markdown.Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
}
