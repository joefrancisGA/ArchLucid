using ArchLucid.Application.Analysis;
using ArchLucid.Application.Analysis.ReplayComparison;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ManifestComparisonRegressionTests
{
    [Theory]
    [InlineData("worker", "orders", RelationshipType.WritesTo)]
    [InlineData("api", "archive", RelationshipType.WritesTo)]
    [InlineData("api", "orders", RelationshipType.ReadsFrom)]
    [InlineData("orders", "api", RelationshipType.WritesTo)]
    public void Changing_one_edge_dimension_reports_the_old_and_new_directed_relationship(
        string source, string target, RelationshipType type)
    {
        GoldenManifest left = Manifest("baseline-v1", "same-run");
        GoldenManifest right = Manifest("candidate-v2", "same-run");
        left.Relationships = [Edge("api", "orders", RelationshipType.WritesTo)];
        right.Relationships = [Edge(source, target, type)];

        ManifestDiffResult diff = new ManifestDiffService().Compare(left, right);

        diff.AddedRelationships.Select(r => (r.SourceId, r.TargetId, r.RelationshipType))
            .Should().Equal((source, target, type.ToString()));
        diff.RemovedRelationships.Select(r => (r.SourceId, r.TargetId, r.RelationshipType))
            .Should().Equal(("api", "orders", nameof(RelationshipType.WritesTo)));
    }

    [Fact]
    public void Service_rename_and_datastore_replacement_report_sorted_additions_and_removals()
    {
        GoldenManifest left = Manifest("baseline-v1", "same-run");
        GoldenManifest right = Manifest("candidate-v2", "same-run");
        left.Services = [new ManifestService { ServiceId = "api", ServiceName = "Orders API" }];
        right.Services =
        [
            new ManifestService { ServiceId = "worker", ServiceName = "Zebra Worker" },
            new ManifestService { ServiceId = "api", ServiceName = "Checkout API" },
        ];
        left.Datastores = [new ManifestDatastore { DatastoreId = "old", DatastoreName = "Old store" }];
        right.Datastores = [new ManifestDatastore { DatastoreId = "new", DatastoreName = "New store" }];

        ManifestDiffResult diff = new ManifestDiffService().Compare(left, right);

        diff.AddedServices.Should().Equal("Checkout API", "Zebra Worker");
        diff.RemovedServices.Should().Equal("Orders API");
        diff.AddedDatastores.Should().Equal("New store");
        diff.RemovedDatastores.Should().Equal("Old store");
    }

    [Fact]
    public void Reordering_and_case_changes_across_runs_do_not_create_topology_deltas()
    {
        GoldenManifest left = Manifest("baseline-v1", "prior-run");
        GoldenManifest right = Manifest("candidate-v2", "new-run");
        left.Services = [new ManifestService { ServiceName = "Orders API" }, new ManifestService { ServiceName = "Worker" }];
        right.Services = [new ManifestService { ServiceName = "WORKER" }, new ManifestService { ServiceName = "ORDERS API" }];
        left.Datastores = [new ManifestDatastore { DatastoreName = "Orders" }];
        right.Datastores = [new ManifestDatastore { DatastoreName = "ORDERS" }];
        left.Relationships = [Edge("api", "orders", RelationshipType.WritesTo)];
        right.Relationships = [Edge("API", "ORDERS", RelationshipType.WritesTo)];

        ManifestDiffResult diff = new ManifestDiffService().Compare(left, right);

        diff.AddedServices.Should().BeEmpty();
        diff.RemovedServices.Should().BeEmpty();
        diff.AddedDatastores.Should().BeEmpty();
        diff.RemovedDatastores.Should().BeEmpty();
        diff.AddedRelationships.Should().BeEmpty();
        diff.RemovedRelationships.Should().BeEmpty();
    }

    [Fact]
    public void Added_relationships_are_ordered_by_source_then_target()
    {
        GoldenManifest left = Manifest("baseline-v1", "same-run");
        GoldenManifest right = Manifest("candidate-v2", "same-run");
        right.Relationships =
        [
            Edge("worker", "orders", RelationshipType.WritesTo),
            Edge("api", "orders", RelationshipType.WritesTo),
            Edge("api", "archive", RelationshipType.WritesTo),
        ];

        ManifestDiffResult diff = new ManifestDiffService().Compare(left, right);

        diff.AddedRelationships.Select(r => (r.SourceId, r.TargetId))
            .Should().Equal(("api", "archive"), ("api", "orders"), ("worker", "orders"));
    }

    [Fact]
    public void Markdown_export_preserves_the_two_snapshots_and_both_directed_change_rows()
    {
        GoldenManifest left = Manifest("baseline-v1", "prior-run");
        GoldenManifest right = Manifest("candidate-v2", "new-run");
        left.Services = [new ManifestService { ServiceName = "Orders API" }];
        right.Services = [new ManifestService { ServiceName = "Orders API" }, new ManifestService { ServiceName = "Worker" }];
        left.Relationships = [Edge("api", "orders", RelationshipType.WritesTo)];
        right.Relationships = [Edge("api", "archive", RelationshipType.WritesTo)];

        ManifestDiffResult diff = new ManifestDiffService().Compare(left, right);
        string summary = new MarkdownManifestDiffSummaryFormatter().FormatMarkdown(diff);
        string export = new MarkdownManifestDiffExportService().GenerateMarkdownExport(left, right, diff, summary);
        string[] lines = export.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        lines.Should().ContainInOrder(
            "- Left Manifest Version: baseline-v1", "- Right Manifest Version: candidate-v2",
            "## Added Relationships", "- **api** -> **archive** (WritesTo)",
            "## Removed Relationships", "- **api** -> **orders** (WritesTo)",
            "## Left Manifest Snapshot", "- Run ID: prior-run", "- Manifest Version: baseline-v1", "- Service Count: 1",
            "## Right Manifest Snapshot", "- Run ID: new-run", "- Manifest Version: candidate-v2", "- Service Count: 2");
    }

    [Fact]
    public async Task Missing_manifest_is_distinct_from_a_computed_no_change_result()
    {
        GoldenManifest left = Manifest("baseline-v1", "prior-run");
        EndToEndReplayComparisonReport report = new();
        ReplayComparisonBuildContext context = new()
        {
            LeftRunId = "prior-run",
            RightRunId = "new-run",
            LeftDetail = new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = "prior-run", CurrentManifestVersion = "baseline-v1" },
                Manifest = left,
            },
            RightDetail = new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = "new-run", CurrentManifestVersion = "candidate-v2" },
            },
            LeftExports = [],
            RightExports = [],
            Report = report,
        };
        await new ReplayComparisonManifestsDiffSlice(new ManifestDiffService()).ApplyAsync(context);

        report.ManifestDiff.Should().BeNull();
        report.Warnings.Should().ContainSingle().Which.Should().Contain("unavailable");
    }

    private static GoldenManifest Manifest(string version, string run) => new()
    {
        RunId = run,
        SystemName = "Orders",
        Metadata = new ManifestMetadata { ManifestVersion = version },
    };

    private static ManifestRelationship Edge(string source, string target, RelationshipType type) => new()
    {
        RelationshipId = "orders-flow",
        SourceId = source,
        TargetId = target,
        RelationshipType = type,
    };
}
