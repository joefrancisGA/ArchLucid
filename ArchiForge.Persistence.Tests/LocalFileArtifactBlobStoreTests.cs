using ArchiForge.Persistence.BlobStore;

using FluentAssertions;

namespace ArchiForge.Persistence.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class LocalFileArtifactBlobStoreTests
{
    [Fact]
    public async Task Write_then_Read_round_trips_utf8_content()
    {
        string root = Path.Combine(Path.GetTempPath(), "archiforge-blob-test-" + Guid.NewGuid().ToString("N"));
        LocalFileArtifactBlobStore store = new(root);

        try
        {
            string uri = await store.WriteAsync("c1", "a/b.json", """{"x":1}""", CancellationToken.None);
            string? read = await store.ReadAsync(uri, CancellationToken.None);
            read.Should().Be("""{"x":1}""");
        }
        finally
        {
            try
            {
                Directory.Delete(root, recursive: true);
            }
            catch (IOException)
            {
            }
        }
    }
}
