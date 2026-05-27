using System.Security.Cryptography;
using System.Text;

using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Chunking;

/// <summary>Stable fingerprint for chunker strategy parameters (TB-047).</summary>
public static class ChunkingStrategyFingerprint
{
    public static string Compute(CorpusKind corpusKind)
    {
        string strategy = corpusKind switch
        {
            CorpusKind.PolicyPack => "PolicyPackChunker:900:120",
            CorpusKind.PriorManifest => "PriorManifestChunker:800:100",
            _ => "SimpleTextChunker:1200:150",
        };

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(strategy));

        return Convert.ToHexString(hash);
    }
}
