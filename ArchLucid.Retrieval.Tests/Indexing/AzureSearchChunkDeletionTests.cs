using ArchLucid.Retrieval.Indexing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests.Indexing;

[Trait("Category", "Unit")]
public sealed class AzureSearchChunkDeletionTests
{
    [Fact]
    public async Task DeleteAllPagesAsync_deletes_all_chunks_when_document_exceeds_search_page_size()
    {
        int fetchCalls = 0;
        List<IReadOnlyList<string>> deletedPages = [];

        await AzureSearchChunkDeletion.DeleteAllPagesAsync(
            _ =>
            {
                fetchCalls++;

                if (fetchCalls == 1)
                {
                    return Task.FromResult<IReadOnlyList<string>>(
                        Enumerable.Range(1, AzureSearchChunkDeletion.PageSize)
                            .Select(static i => $"chunk-{i}")
                            .ToList());
                }

                if (fetchCalls == 2)
                    return Task.FromResult<IReadOnlyList<string>>(["chunk-1001"]);

                return Task.FromResult<IReadOnlyList<string>>([]);
            },
            (chunkIds, _) =>
            {
                deletedPages.Add(chunkIds);

                return Task.CompletedTask;
            },
            CancellationToken.None);

        deletedPages.Should().HaveCount(2);
        deletedPages[0].Count.Should().Be(AzureSearchChunkDeletion.PageSize);
        deletedPages[1].Should().ContainSingle().Which.Should().Be("chunk-1001");
        fetchCalls.Should().Be(2);
    }
}
