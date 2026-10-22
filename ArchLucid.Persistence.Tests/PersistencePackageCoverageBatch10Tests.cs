using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Coordination.Replay;
using ArchLucid.Persistence.Configuration;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class PersistencePackageCoverageBatch10Tests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public void GraphSnapshotEdgeIndexer_builds_rows_from_snapshot_edges()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        GraphSnapshot snapshot = new()
        {
            GraphSnapshotId = snapshotId,
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-1",
                    FromNodeId = "n1",
                    ToNodeId = "n2",
                    EdgeType = "DEPENDS_ON",
                    Weight = 0.75,
                },
            ],
        };

        IReadOnlyList<GraphSnapshotEdgeRow> rows = GraphSnapshotEdgeIndexer.BuildRows(snapshot);

        rows.Should().ContainSingle();
        rows[0].GraphSnapshotId.Should().Be(snapshotId);
        rows[0].EdgeId.Should().Be("edge-1");
        rows[0].FromNodeId.Should().Be("n1");
        rows[0].ToNodeId.Should().Be("n2");
        rows[0].EdgeType.Should().Be("DEPENDS_ON");
        rows[0].Weight.Should().Be(0.75);
    }

    [Fact]
    public void GraphSnapshotEdgeIndexer_rejects_null_snapshot()
    {
        Action act = () => GraphSnapshotEdgeIndexer.BuildRows(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ProductLearningSignalAggregations_builds_keys_and_comment_themes()
    {
        ProductLearningSignalAggregations.BuildAggregateKey("pattern.a", "RunOutput", "diagram")
            .Should().Be("pattern.a");
        ProductLearningSignalAggregations.BuildAggregateKey(null, "RunOutput", "diagram")
            .Should().Be("subject:RunOutput|artifact:diagram");
        ProductLearningSignalAggregations.BuildTrendKey("RunOutput", null).Should().Be("RunOutput|*");
        ProductLearningSignalAggregations.BuildArtifactTypeOrHint("RunOutput", "diagram").Should().Be("diagram");
        ProductLearningSignalAggregations.NormalizeCommentThemeKey("  repeated reviewer note  ")
            .Should().Be("repeated reviewer note");
        ProductLearningSignalAggregations.NormalizeCommentThemeKey(new string('x', 250))
            .Should().HaveLength(ProductLearningSignalAggregations.CommentThemePrefixLength);
    }

    [Fact]
    public void ProductLearningSignalAggregations_builds_repeated_comment_themes_and_opportunities()
    {
        DateTime recordedUtc = new(2026, 7, 20, 12, 0, 0, DateTimeKind.Utc);
        List<ProductLearningPilotSignalRecord> scoped =
        [
            CreateSignal("finding layout", ProductLearningDispositionValues.Rejected, recordedUtc),
            CreateSignal("finding layout", ProductLearningDispositionValues.Revised, recordedUtc.AddMinutes(1)),
            CreateSignal("finding layout", ProductLearningDispositionValues.NeedsFollowUp, recordedUtc.AddMinutes(2)),
        ];

        IReadOnlyList<RepeatedCommentTheme> themes =
            ProductLearningSignalAggregations.BuildRepeatedCommentThemes(scoped, minOccurrences: 2, take: 5);

        themes.Should().ContainSingle();
        themes[0].OccurrenceCount.Should().Be(3);
        themes[0].SampleCommentShort.Should().Contain("finding layout");

        IReadOnlyList<ImprovementOpportunity> opportunities =
            ProductLearningSignalAggregations.BuildImprovementOpportunityCandidates(
                scoped,
                minPoorOutcomeSignals: 1,
                minRevisedSignals: 1,
                take: 3);

        opportunities.Should().NotBeEmpty();
        opportunities[0].PriorityRank.Should().Be(1);
        opportunities[0].EvidenceSignalCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public void ProductLearningSignalAggregations_filter_scope_honors_since_utc()
    {
        DateTime older = new(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime newer = new(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc);
        List<ProductLearningPilotSignalRecord> source =
        [
            CreateSignal("old", ProductLearningDispositionValues.Trusted, older),
            CreateSignal("new", ProductLearningDispositionValues.Trusted, newer),
        ];

        IEnumerable<ProductLearningPilotSignalRecord> filtered =
            ProductLearningSignalAggregations.FilterScope(source, TenantId, WorkspaceId, ProjectId, sinceUtc: newer);

        filtered.Should().ContainSingle(record => record.CommentShort == "new");
    }

    [Fact]
    public void ReplayMode_and_dapper_timeouts_expose_stable_tokens()
    {
        ReplayMode.ReconstructOnly.Should().Be("ReconstructOnly");
        ReplayMode.RebuildManifest.Should().Be("RebuildManifest");
        ReplayMode.RebuildArtifacts.Should().Be("RebuildArtifacts");
        DapperCommandTimeoutSeconds.Standard.Should().Be(30);
        DapperCommandTimeoutSeconds.Interactive.Should().Be(5);
        DapperCommandTimeoutSeconds.Report.Should().Be(120);
    }

    private static ProductLearningPilotSignalRecord CreateSignal(
        string commentShort,
        string disposition,
        DateTime recordedUtc)
    {
        return new ProductLearningPilotSignalRecord
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SubjectType = ProductLearningSubjectTypeValues.RunOutput,
            Disposition = disposition,
            CommentShort = commentShort,
            PatternKey = "layout.diagram",
            RecordedUtc = recordedUtc,
            SignalId = Guid.NewGuid(),
        };
    }
}
