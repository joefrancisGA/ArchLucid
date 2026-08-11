using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
///     RC28d package-coverage batch: prior-manifest decision/topology indexing and policy-pack chunking edges.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalPackageCoverageBatchRc28dTests
{
    [Fact]
    public void PriorManifestRetrievalDocumentBuilder_BuildFromManifest_indexes_decisions_and_topology()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ManifestDocument manifest = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            RunId = runId,
            ManifestId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    DecisionId = "dec-1",
                    Category = "Security",
                    Title = "Prefer private endpoints",
                    SelectedOption = "Private Link",
                    Rationale = "Reduce public exposure.",
                },
                new ResolvedArchitectureDecision
                {
                    DecisionId = "dec-skip",
                    Category = "Cost",
                    Title = "   ",
                    SelectedOption = "n/a",
                    Rationale = "blank title skipped",
                },
            ],
            Topology = new TopologySection
            {
                Services =
                [
                    new ManifestService { ServiceName = "orders-api" },
                    new ManifestService { ServiceName = "  " },
                ],
                Datastores =
                [
                    new ManifestDatastore { DatastoreName = "orders-db" },
                ],
            },
        };

        IReadOnlyList<RetrievalDocument> documents = PriorManifestRetrievalDocumentBuilder.BuildFromManifest(
            manifest,
            new DateTime(2026, 8, 10, 12, 0, 0, DateTimeKind.Utc));

        documents.Should().HaveCount(2);
        RetrievalDocument decision = documents.Should().ContainSingle(d => d.SourceType == "PriorManifestDecision").Subject;
        decision.SourceId.Should().Be("dec-1");
        decision.Content.Should().Contain("Prefer private endpoints");
        decision.Content.Should().Contain("Private Link");
        decision.CorpusKind.Should().Be(CorpusKind.PriorManifest);

        RetrievalDocument topology = documents.Should().ContainSingle(d => d.SourceType == "PriorManifestTopology").Subject;
        topology.Content.Should().Contain("orders-api");
        topology.Content.Should().Contain("orders-db");
        topology.Content.Should().Contain("Relationships: 0");
    }

    [Fact]
    public void PriorManifestRetrievalDocumentBuilder_BuildFromManifest_null_throws()
    {
        FluentActions
            .Invoking(() => PriorManifestRetrievalDocumentBuilder.BuildFromManifest(null!, DateTime.UtcNow))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Fact]
    public void PolicyPackChunker_handles_empty_header_fallback_and_sentence_windows()
    {
        PolicyPackChunker chunker = new();

        chunker.Chunk("   ").Should().BeEmpty();
        chunker.Chunk("short rule").Should().Equal("short rule");
        chunker.Chunk("Header only:").Should().Equal("Header only:");

        string longBody = string.Join(
            " ",
            Enumerable.Range(0, 40).Select(i => $"Sentence number {i} elaborates the control requirement."));
        string longRule = $"SEC-1: {longBody}";

        IReadOnlyList<string> chunks = chunker.Chunk(longRule, maxChars: 180, overlap: 20);
        chunks.Should().NotBeEmpty();
        chunks.Should().OnlyContain(c => c.StartsWith("SEC-1:", StringComparison.Ordinal));
        chunks.Sum(c => c.Length).Should().BeGreaterThan(180);

        string noHeader = new string('x', 250);
        IReadOnlyList<string> fallback = chunker.Chunk(noHeader, maxChars: 100, overlap: 10);
        fallback.Should().HaveCountGreaterThan(1);
    }
}
