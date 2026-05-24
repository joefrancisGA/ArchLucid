using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPackCorpusIndexerTests
{
    [Fact]
    public async Task BuildDocumentsAsync_indexes_rules_with_platform_sentinel_and_stable_hash()
    {
        string packsRoot = ResolveRepoPolicyPacksDirectory();
        if (!Directory.Exists(packsRoot))
            throw new FileNotFoundException("Policy pack templates directory not found.", packsRoot);

        MockOptionsMonitor<PolicyPackCorpusIndexerOptions> options = new(new PolicyPackCorpusIndexerOptions
        {
            PolicyPacksDirectory = packsRoot,
            RulesFileName = "compliance-rules.json",
        });

        PolicyPackCorpusIndexer sut = new(options);
        IReadOnlyList<RetrievalDocument> docs = await sut.BuildDocumentsAsync(CancellationToken.None);

        docs.Should().NotBeEmpty();
        RetrievalDocument first = docs[0];
        first.TenantId.Should().Be(CorpusKindSentinels.PlatformSentinelTenantId);
        first.CorpusKind.Should().Be(CorpusKind.PolicyPack);
        first.SourceType.Should().Be("PolicyPackRule");
        first.ContentHash.Should().NotBeNullOrWhiteSpace();

        await sut.BuildDocumentsAsync(CancellationToken.None);
        docs[0].ContentHash.Should().Be(first.ContentHash);
    }

    private static string ResolveRepoPolicyPacksDirectory()
    {
        DirectoryInfo? current = new(AppContext.BaseDirectory);

        for (int depth = 0; depth < 8 && current is not null; depth++)
        {
            string candidate = Path.Combine(current.FullName, "templates", "policy-packs");

            if (Directory.Exists(candidate))
                return candidate;

            current = current.Parent;
        }

        return Path.Combine(AppContext.BaseDirectory, "templates", "policy-packs");
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
