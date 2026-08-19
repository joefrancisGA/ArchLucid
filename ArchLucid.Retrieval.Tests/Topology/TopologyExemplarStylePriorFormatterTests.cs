using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;
using ArchLucid.Retrieval.Topology;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Tests.Topology;

[Trait("Suite", "Core")]
public sealed class TopologyExemplarStylePriorFormatterTests
{
    [Fact]
    public void FormatStylePriorBlock_WhenEmpty_SignalsExemplarMissing()
    {
        string block = TopologyExemplarStylePriorFormatter.FormatStylePriorBlock([]);

        block.Should().Contain("exemplarMissing: true");
    }

    [Fact]
    public void FormatStylePriorBlock_WhenHitsPresent_IncludesStyleGuideText()
    {
        RetrievalHit hit = new()
        {
            ChunkId = "chunk-1",
            DocumentId = "exemplar-standard-3-tier",
            CorpusKind = "ReferenceArchitecture",
            SourceType = "ReferenceArchitectureExemplar",
            SourceId = "standard-3-tier-web",
            Title = "Standard 3-tier web",
            Text = "App Service front-end with SQL backend.",
            Score = 0.92,
        };

        string block = TopologyExemplarStylePriorFormatter.FormatStylePriorBlock([hit]);

        block.Should().Contain("exemplarMissing: false");
        block.Should().Contain("App Service front-end with SQL backend.");
    }

    [Fact]
    public void BuildExemplarQueryText_IncludesCloudProviderAndConstraints()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "REQ-001",
            SystemName = "ContosoRetailWeb",
            Description = "Three-tier web application.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints = ["Private endpoints for data tiers"],
        };

        string query = TopologyExemplarStylePriorFormatter.BuildExemplarQueryText(request);

        query.Should().Contain("Azure");
        query.Should().Contain("ContosoRetailWeb");
        query.Should().Contain("Private endpoints for data tiers");
    }

    [Fact]
    public async Task FormatStylePriorBlock_WhenMicroservicesExemplarIndexed_IncludesStyleGuideText()
    {
        string exemplarsRoot = ResolveRepoReferenceArchitecturesDirectory();
        if (!Directory.Exists(exemplarsRoot))
            throw new FileNotFoundException("Reference architectures directory not found.", exemplarsRoot);

        MockOptionsMonitor<ExemplarCorpusIndexerOptions> options = new(new ExemplarCorpusIndexerOptions
        {
            ReferenceArchitecturesDirectory = exemplarsRoot,
            StarterProofPacksDirectory = Path.Combine(exemplarsRoot, "_no_starter_packs_for_test"),
        });

        ExemplarCorpusIndexer indexer = new(options);
        IReadOnlyList<RetrievalDocument> docs = await indexer.BuildDocumentsAsync(CancellationToken.None);
        RetrievalDocument microservices = docs.Single(d => d.SourceId == "REF-TPL-MICROSERVICES-API-GW-001");

        RetrievalHit hit = new()
        {
            ChunkId = "chunk-microservices",
            DocumentId = microservices.DocumentId,
            CorpusKind = CorpusKind.ReferenceArchitecture.ToString(),
            SourceType = "ReferenceArchitectureExemplar",
            SourceId = microservices.SourceId,
            Title = microservices.Title,
            Text = microservices.Content,
            Score = 0.88,
        };

        string block = TopologyExemplarStylePriorFormatter.FormatStylePriorBlock([hit]);

        block.Should().Contain("exemplarMissing: false");
        block.Should().Contain("Azure API Management");
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
