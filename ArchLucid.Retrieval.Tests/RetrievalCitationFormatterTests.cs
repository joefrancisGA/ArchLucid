using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Citations;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class RetrievalCitationFormatterTests
{
    [Fact]
    public void Format_uses_corpus_sourceId_and_version_from_bracketed_text()
    {
        RetrievalCitationFormatter sut = new();

        string citation = sut.Format(
            new RetrievalHit
            {
                ChunkId = "chunk-1",
                CorpusKind = nameof(CorpusKind.PolicyPack),
                SourceId = "saas-ctrl-002",
                Text = "[saas-vertical-v1 v1.0.0] [Error] Encrypt data.",
            });

        citation.Should().Be("[PolicyPack]/[saas-ctrl-002]@1.0.0");
    }

    [Fact]
    public void Format_falls_back_to_chunk_id_and_default_version()
    {
        RetrievalCitationFormatter sut = new();

        string citation = sut.Format(
            new RetrievalHit
            {
                ChunkId = "chunk-fallback",
                CorpusKind = "PriorManifest",
                SourceId = "   ",
                Text = "No version marker here.",
            });

        citation.Should().Be("[PriorManifest]/[chunk-fallback]@1");
    }
}
