using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class PlatformDocCorpusIndexerTests
{
    [Fact]
    public async Task BuildDocumentsAsync_indexes_adrs_with_platform_sentinel_and_stable_hash()
    {
        string adrsRoot = ResolveRepoAdrsDirectory();
        if (!Directory.Exists(adrsRoot))
            throw new FileNotFoundException("ADR directory not found.", adrsRoot);

        MockOptionsMonitor<PlatformDocCorpusIndexerOptions> options = new(new PlatformDocCorpusIndexerOptions
        {
            DocsRootDirectory = adrsRoot,
            MaxDocuments = 8,
        });

        PlatformDocCorpusIndexer sut = new(options);
        IReadOnlyList<RetrievalDocument> docs = await sut.BuildDocumentsAsync(CancellationToken.None);

        docs.Should().NotBeEmpty();
        RetrievalDocument first = docs[0];
        first.TenantId.Should().Be(CorpusKindSentinels.PlatformSentinelTenantId);
        first.CorpusKind.Should().Be(CorpusKind.PlatformDoc);
        first.SourceType.Should().Be("PlatformDoc");
        first.ContentHash.Should().NotBeNullOrWhiteSpace();

        IReadOnlyList<RetrievalDocument> secondPass = await sut.BuildDocumentsAsync(CancellationToken.None);
        secondPass[0].ContentHash.Should().Be(first.ContentHash);
    }

    private static string ResolveRepoAdrsDirectory()
    {
        DirectoryInfo? current = new(AppContext.BaseDirectory);

        for (int depth = 0; depth < 8 && current is not null; depth++)
        {
            string candidate = Path.Combine(current.FullName, "docs", "architecture", "adrs");

            if (Directory.Exists(candidate))
                return candidate;

            current = current.Parent;
        }

        return Path.Combine(AppContext.BaseDirectory, "docs", "architecture", "adrs");
    }

    private sealed class MockOptionsMonitor<T>(T value) : IOptionsMonitor<T> where T : class
    {
        public T CurrentValue => value;

        public T Get(string? name) => value;

        public IDisposable OnChange(Action<T, string?> listener) => NullDisposable.Instance;

        private sealed class NullDisposable : IDisposable
        {
            internal static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
