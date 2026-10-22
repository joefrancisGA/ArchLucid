using ArchLucid.Application.Analysis;
using ArchLucid.Application.Diffs;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class MarkdownEndToEndReplayComparisonSummaryFormatterTests
{
    [SkippableFact]
    public void FormatMarkdown_includes_datastore_and_relationship_manifest_diffs()
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
}
