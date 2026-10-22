using ArchLucid.Core.Retrieval;
using ArchLucid.Persistence.Retrieval;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Retrieval;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryRetrievalGroundingTraceWriterTests
{
    [Fact]
    public async Task AppendAsync_then_GetByRunIdAsync_returns_scoped_rows()
    {
        InMemoryRetrievalGroundingTraceWriter sut = new();
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid runId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        DateTime createdUtc = DateTime.Parse("2026-02-01T00:00:00Z");

        RetrievalGroundingTraceInsert match = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            RunId = runId,
            AgentName = "planner",
            RetrievedChunkIds = ["chunk-1"],
            CitationCoverage = 0.75,
            QueryText = "network segmentation",
            CreatedUtc = createdUtc,
        };

        RetrievalGroundingTraceInsert otherRun = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            RunId = Guid.NewGuid(),
            AgentName = "other",
            RetrievedChunkIds = ["chunk-2"],
            CitationCoverage = 0.5,
            CreatedUtc = createdUtc,
        };

        await sut.AppendAsync(match, CancellationToken.None);
        await sut.AppendAsync(otherRun, CancellationToken.None);

        IReadOnlyList<RetrievalGroundingTraceRecord> rows = await sut.GetByRunIdAsync(
            tenantId,
            workspaceId,
            projectId,
            runId,
            CancellationToken.None);

        rows.Should().HaveCount(1);
        rows[0].TenantId.Should().Be(tenantId);
        rows[0].RunId.Should().Be(runId);
        rows[0].AgentName.Should().Be("planner");
        rows[0].RetrievedChunkIds.Should().Equal(["chunk-1"]);
        rows[0].CitationCoverage.Should().Be(0.75);
        rows[0].QueryText.Should().Be("network segmentation");
        rows[0].CreatedUtc.Should().Be(createdUtc);
        sut.Rows.Should().HaveCount(2);
    }

    [Fact]
    public async Task AppendAsync_throws_when_insert_null()
    {
        InMemoryRetrievalGroundingTraceWriter sut = new();

        Func<Task> act = async () => await sut.AppendAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }
}
