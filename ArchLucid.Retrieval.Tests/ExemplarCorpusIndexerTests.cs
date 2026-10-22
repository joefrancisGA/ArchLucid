using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class ExemplarCorpusIndexerTests
{
    [Fact]
    public async Task BuildDocumentsAsync_indexes_at_least_ten_reference_architecture_exemplars()
    {
        string exemplarsRoot = ResolveRepoReferenceArchitecturesDirectory();
        if (!Directory.Exists(exemplarsRoot))
            throw new FileNotFoundException("Reference architectures directory not found.", exemplarsRoot);

        MockOptionsMonitor<ExemplarCorpusIndexerOptions> options = new(new ExemplarCorpusIndexerOptions
        {
            ReferenceArchitecturesDirectory = exemplarsRoot,
            StarterProofPacksDirectory = Path.Combine(exemplarsRoot, "_no_starter_packs_for_test"),
            MaxDocuments = 64,
        });

        ExemplarCorpusIndexer sut = new(options);
        IReadOnlyList<RetrievalDocument> docs = await sut.BuildDocumentsAsync(CancellationToken.None);

        docs.Should().HaveCountGreaterThanOrEqualTo(10);
        docs.Should().OnlyContain(d => d.CorpusKind == CorpusKind.ReferenceArchitecture);
        docs.Should().OnlyContain(d => d.SourceType == "ReferenceArchitectureExemplar");
        docs.Should().OnlyContain(d => d.TenantId == CorpusKindSentinels.PlatformSentinelTenantId);
        docs.Select(d => d.SourceId).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task BuildDocumentsAsync_produces_stable_content_hash_per_exemplar()
    {
        string exemplarsRoot = ResolveRepoReferenceArchitecturesDirectory();
        if (!Directory.Exists(exemplarsRoot))
            throw new FileNotFoundException("Reference architectures directory not found.", exemplarsRoot);

        MockOptionsMonitor<ExemplarCorpusIndexerOptions> options = new(new ExemplarCorpusIndexerOptions
        {
            ReferenceArchitecturesDirectory = exemplarsRoot,
            StarterProofPacksDirectory = Path.Combine(exemplarsRoot, "_no_starter_packs_for_test"),
        });

        ExemplarCorpusIndexer sut = new(options);
        IReadOnlyList<RetrievalDocument> firstPass = await sut.BuildDocumentsAsync(CancellationToken.None);
        IReadOnlyList<RetrievalDocument> secondPass = await sut.BuildDocumentsAsync(CancellationToken.None);

        firstPass.Should().NotBeEmpty();
        firstPass[0].ContentHash.Should().NotBeNullOrWhiteSpace();
        secondPass[0].ContentHash.Should().Be(firstPass[0].ContentHash);
    }

    private static string ResolveRepoReferenceArchitecturesDirectory()
    {
        DirectoryInfo? current = new(AppContext.BaseDirectory);

        for (int depth = 0; depth < 8 && current is not null; depth++)
        {
            string candidate = Path.Combine(current.FullName, "templates", "reference-architectures");

            if (Directory.Exists(candidate))
                return candidate;

            current = current.Parent;
        }

        return Path.Combine(AppContext.BaseDirectory, "templates", "reference-architectures");
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
