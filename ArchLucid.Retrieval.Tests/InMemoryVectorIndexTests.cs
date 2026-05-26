using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
/// <see cref="InMemoryVectorIndex"/> scope filters and cosine edge cases used by <see cref="Queries.RetrievalQueryService"/>.
/// </summary>
[Trait("Category", "Unit")]
public sealed class InMemoryVectorIndexTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public async Task SearchAsync_WrongTenant_ReturnsEmpty()
    {
        InMemoryVectorIndex sut = new();
        await sut.UpsertChunksAsync(
            [MakeChunk("x", TenantId, WorkspaceId, ProjectId, [1f, 0f])],
            CancellationToken.None);

        RetrievalQuery query = BaseQuery();
        query.TenantId = Guid.NewGuid();
        float[] embedding = [1f, 0f];

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(query, embedding, CancellationToken.None);

        hits.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchAsync_WhenQuerySpecifiesRunId_ExcludesChunksWithoutSameRun()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        InMemoryVectorIndex sut = new();
        RetrievalChunk withRun = MakeChunk("with-run", TenantId, WorkspaceId, ProjectId, [1f, 0f]);
        withRun.RunId = runId;
        RetrievalChunk noRun = MakeChunk("no-run", TenantId, WorkspaceId, ProjectId, [1f, 0f]);
        noRun.RunId = null;
        await sut.UpsertChunksAsync([withRun, noRun], CancellationToken.None);

        RetrievalQuery query = BaseQuery();
        query.RunId = runId;

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(query, [1f, 0f], CancellationToken.None);

        hits.Should().ContainSingle().Which.ChunkId.Should().Be("with-run");
    }

    [Fact]
    public async Task SearchAsync_MismatchedEmbeddingLength_AssignsZeroScore()
    {
        InMemoryVectorIndex sut = new();
        await sut.UpsertChunksAsync(
            [MakeChunk("wide", TenantId, WorkspaceId, ProjectId, [1f, 0f, 0f])],
            CancellationToken.None);

        RetrievalQuery query = BaseQuery();
        float[] shortQuery = [1f, 0f];

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(query, shortQuery, CancellationToken.None);

        hits.Should().ContainSingle().Which.Score.Should().Be(0);
    }

    [Fact]
    public async Task UpsertChunksAsync_ReplacesChunkWithSameChunkId()
    {
        InMemoryVectorIndex sut = new();
        RetrievalChunk first = MakeChunk("same", TenantId, WorkspaceId, ProjectId, [0f, 1f]);
        first.Text = "v1";
        RetrievalChunk second = MakeChunk("same", TenantId, WorkspaceId, ProjectId, [1f, 0f]);
        second.Text = "v2";

        await sut.UpsertChunksAsync([first], CancellationToken.None);
        await sut.UpsertChunksAsync([second], CancellationToken.None);

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(BaseQuery(), [1f, 0f], CancellationToken.None);

        hits.Should().ContainSingle().Which.Text.Should().Be("v2");
    }

    [Fact]
    public async Task SearchAsync_IncludePlatformCorpora_FiltersPolicyPackToAssignedRulePackIds()
    {
        InMemoryVectorIndex sut = new();
        await sut.UpsertChunksAsync(
            [
                MakePlatformPolicyPackChunk("assigned", "pack-a", [1f, 0f]),
                MakePlatformPolicyPackChunk("unassigned", "pack-b", [1f, 0f]),
            ],
            CancellationToken.None);

        RetrievalQuery query = BaseQuery();
        query.IncludePlatformCorpora = true;
        query.AllowedPolicyPackRulePackIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "pack-a" };

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(query, [1f, 0f], CancellationToken.None);

        hits.Should().ContainSingle().Which.ChunkId.Should().Be("assigned");
    }

    [Fact]
    public async Task SearchAsync_IncludePlatformCorpora_WithNoAssignedPacks_ExcludesAllPolicyPackChunks()
    {
        InMemoryVectorIndex sut = new();
        await sut.UpsertChunksAsync(
            [MakePlatformPolicyPackChunk("pack-a-chunk", "pack-a", [1f, 0f])],
            CancellationToken.None);

        RetrievalQuery query = BaseQuery();
        query.IncludePlatformCorpora = true;
        query.AllowedPolicyPackRulePackIds = [];

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(query, [1f, 0f], CancellationToken.None);

        hits.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchAsync_IncludePlatformCorpora_StillReturnsNonPolicyPackPlatformCorpus()
    {
        InMemoryVectorIndex sut = new();
        RetrievalChunk platformDoc = MakeChunk("platform-doc", TenantId, WorkspaceId, ProjectId, [1f, 0f]);
        platformDoc.TenantId = CorpusKindSentinels.PlatformSentinelTenantId;
        platformDoc.CorpusKind = CorpusKind.PlatformDoc;
        await sut.UpsertChunksAsync([platformDoc], CancellationToken.None);

        RetrievalQuery query = BaseQuery();
        query.IncludePlatformCorpora = true;
        query.AllowedPolicyPackRulePackIds = [];

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(query, [1f, 0f], CancellationToken.None);

        hits.Should().ContainSingle().Which.ChunkId.Should().Be("platform-doc");
    }

    [Fact]
    public async Task SearchAsync_TenantScopedPriorManifest_DoesNotLeakOtherTenant()
    {
        Guid otherTenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        InMemoryVectorIndex sut = new();
        await sut.UpsertChunksAsync(
            [
                MakeChunk("tenant-a", TenantId, WorkspaceId, ProjectId, [1f, 0f]),
                MakeChunk("tenant-b", otherTenantId, WorkspaceId, ProjectId, [1f, 0f]),
            ],
            CancellationToken.None);

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(BaseQuery(), [1f, 0f], CancellationToken.None);

        hits.Should().ContainSingle().Which.ChunkId.Should().Be("tenant-a");
    }

    [Fact]
    public async Task SearchAsync_TenantScopedPriorManifest_DoesNotLeakOtherTenant_DecisionsAndFindings()
    {
        Guid otherTenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        InMemoryVectorIndex sut = new();

        RetrievalChunk myDecision = MakeChunk("my-dec", TenantId, WorkspaceId, ProjectId, [1f, 0f]);
        myDecision.DecisionId = "dec-1";
        
        RetrievalChunk otherDecision = MakeChunk("other-dec", otherTenantId, WorkspaceId, ProjectId, [1f, 0f]);
        otherDecision.DecisionId = "dec-2";
        
        RetrievalChunk myFinding = MakeChunk("my-fin", TenantId, WorkspaceId, ProjectId, [1f, 0f]);
        myFinding.FindingId = "fin-1";
        
        RetrievalChunk otherFinding = MakeChunk("other-fin", otherTenantId, WorkspaceId, ProjectId, [1f, 0f]);
        otherFinding.FindingId = "fin-2";

        await sut.UpsertChunksAsync(
            [myDecision, otherDecision, myFinding, otherFinding],
            CancellationToken.None);

        IReadOnlyList<RetrievalHit> hits = await sut.SearchAsync(BaseQuery(), [1f, 0f], CancellationToken.None);

        hits.Should().HaveCount(2);
        hits.Select(h => h.ChunkId).Should().Contain(new[] { "my-dec", "my-fin" });
        hits.Select(h => h.ChunkId).Should().NotContain(new[] { "other-dec", "other-fin" });
    }

    private static RetrievalChunk MakePlatformPolicyPackChunk(string chunkId, string rulePackId, float[] embedding)
    {
        RetrievalChunk chunk = MakeChunk(
            chunkId,
            CorpusKindSentinels.PlatformSentinelTenantId,
            WorkspaceId,
            ProjectId,
            embedding);
        chunk.CorpusKind = CorpusKind.PolicyPack;
        chunk.PolicyPackRulePackId = rulePackId;

        return chunk;
    }

    private static RetrievalQuery BaseQuery()
    {
        return new RetrievalQuery
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            QueryText = "ignored-here",
            TopK = 8
        };
    }

    private static RetrievalChunk MakeChunk(
        string chunkId,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        float[] embedding)
    {
        return new RetrievalChunk
        {
            ChunkId = chunkId,
            DocumentId = "d",
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            SourceType = "Test",
            SourceId = chunkId,
            Title = chunkId,
            Text = chunkId,
            ChunkOrdinal = 0,
            Embedding = embedding
        };
    }
}
