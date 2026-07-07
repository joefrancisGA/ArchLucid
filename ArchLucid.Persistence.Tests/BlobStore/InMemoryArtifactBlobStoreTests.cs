using ArchLucid.Persistence.BlobStore;

namespace ArchLucid.Persistence.Tests.BlobStore;

[Trait("Category", "Unit")]
public sealed class InMemoryArtifactBlobStoreTests
{
    [Fact]
    public async Task Write_read_and_existing_uri_round_trip()
    {
        InMemoryArtifactBlobStore sut = new();

        string uri = await sut.WriteAsync("artifacts", "proof.json", "{\"ok\":true}", CancellationToken.None);

        (await sut.TryGetExistingUriAsync("artifacts", "proof.json", CancellationToken.None)).Should().Be(uri);
        (await sut.ReadAsync(uri, CancellationToken.None)).Should().Be("{\"ok\":true}");
    }

    [Fact]
    public async Task Read_blank_uri_returns_null()
    {
        InMemoryArtifactBlobStore sut = new();

        (await sut.ReadAsync("  ", CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task TryGetExistingUri_returns_null_for_missing_blob()
    {
        InMemoryArtifactBlobStore sut = new();

        (await sut.TryGetExistingUriAsync("artifacts", "missing.json", CancellationToken.None)).Should().BeNull();
    }
}
