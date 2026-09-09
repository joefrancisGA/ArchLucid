namespace ArchLucid.Core.Findings;

/// <summary>
///     Returns the highest Jaccard similarity peer for duplication penalties and cross-engine corroboration (DX-63).
/// </summary>
public static class InsightDensityTextSimilarityWithPeer
{
    public static (double Similarity, InsightDensityGateCandidate? Peer) MaxPeerSimilarityWithPeer(
        string message,
        IReadOnlyList<InsightDensityGateCandidate> peers,
        string candidateKey)
    {
        ArgumentNullException.ThrowIfNull(message);
        ArgumentNullException.ThrowIfNull(peers);
        ArgumentException.ThrowIfNullOrWhiteSpace(candidateKey);

        double maxSimilarity = 0;
        InsightDensityGateCandidate? maxPeer = null;

        foreach (InsightDensityGateCandidate peer in peers)
        {
            if (string.Equals(peer.CandidateKey, candidateKey, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            double similarity = InsightDensityTextSimilarity.JaccardSimilarity(message, peer.Message);

            if (similarity > maxSimilarity)
            {
                maxSimilarity = similarity;
                maxPeer = peer;
            }
        }

        return (maxSimilarity, maxPeer);
    }
}
