using ArchLucid.AgentRuntime;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class RetrievalGroundingTraceBuilderTests
{
    [Fact]
    public void Build_persists_bounded_query_scores_and_document_ids()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        RetrievalQuery query = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            QueryText = new string('q', 5000),
            TopK = 6,
        };

        List<RetrievalHit> hits =
        [
            new()
            {
                ChunkId = "chunk-1",
                DocumentId = "doc-a",
                CorpusKind = "PolicyPack",
                Score = 0.9123456,
            },
            new()
            {
                ChunkId = "chunk-2",
                DocumentId = "doc-b",
                CorpusKind = "PolicyPack",
                Score = 0.8123,
            },
        ];

        RetrievalGroundingTraceInsert insert = RetrievalGroundingTraceBuilder.Build(
            scope,
            runId,
            "Compliance",
            query,
            hits,
            "trace-abc");

        insert.QueryText.Should().HaveLength(RetrievalGroundingTraceBounds.MaxQueryTextLength);
        insert.TopK.Should().Be(6);
        insert.CorpusKind.Should().Be("PolicyPack");
        insert.ScoresJson.Should().Contain("chunk-1");
        insert.DocumentIdsJson.Should().Contain("doc-a");
        insert.AgentExecutionTraceId.Should().Be("trace-abc");
        insert.RetrievedChunkIds.Should().Equal("chunk-1", "chunk-2");
    }

    [Fact]
    public void Build_non_compliance_agent_name_is_supported()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        RetrievalQuery query = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            QueryText = "prior manifest topology",
            TopK = 4,
        };

        RetrievalGroundingTraceInsert insert = RetrievalGroundingTraceBuilder.Build(
            scope,
            Guid.NewGuid(),
            "Topology",
            query,
            []);

        insert.AgentName.Should().Be("Topology");
        insert.CitationCoverage.Should().Be(0);
        insert.CorpusKind.Should().BeNull();
    }
}
