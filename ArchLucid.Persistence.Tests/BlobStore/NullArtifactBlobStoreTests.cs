using ArchLucid.Persistence.BlobStore;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.BlobStore;

[Trait("Category", "Unit")]
public sealed class NullArtifactBlobStoreTests
{
    [Fact]
    public async Task ReadAsync_returns_null()
    {
        NullArtifactBlobStore sut = new();

        string? content = await sut.ReadAsync("blob://disabled", CancellationToken.None);

        content.Should().BeNull();
    }

    [Fact]
    public async Task TryGetExistingUriAsync_returns_null()
    {
        NullArtifactBlobStore sut = new();

        string? uri = await sut.TryGetExistingUriAsync("container", "blob", CancellationToken.None);

        uri.Should().BeNull();
    }

    [Fact]
    public async Task WriteAsync_throws_invalid_operation()
    {
        NullArtifactBlobStore sut = new();

        Func<Task> act = async () =>
            await sut.WriteAsync("container", "blob", "payload", CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
