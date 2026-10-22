using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Configuration;
using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Chunking;

/// <summary>Stable fingerprint for chunker strategy parameters (TB-047).</summary>
public static class ChunkingStrategyFingerprint
{
    public static string Compute(
        CorpusKind corpusKind,
        RetrievalChunkingStrategy strategy = RetrievalChunkingStrategy.Simple)
    {
        string strategyLabel = corpusKind switch
        {
            CorpusKind.PolicyPack => "PolicyPackChunker:900:120",
            CorpusKind.PriorManifest => "PriorManifestChunker:800:100",
            _ when strategy == RetrievalChunkingStrategy.Semantic => "StructureAwareTextChunker:1200:150",
            _ => "SimpleTextChunker:1200:150",
        };

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(strategyLabel));

        return Convert.ToHexString(hash);
    }
}
