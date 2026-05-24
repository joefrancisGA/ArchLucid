using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Evaluation;

/// <summary>Faithfulness report for retrieval-grounded agent output (RAG-V1-005).</summary>
public sealed record RetrievalFaithfulnessReport(
    int RetrievedChunkCount,
    int SupportedChunkCount,
    double SupportRatio,
    IReadOnlyList<string> UnsupportedSourceIds);

/// <summary>Scores whether agent output text cites retrieved chunks.</summary>
public static class RetrievalFaithfulnessEvaluator
{
    /// <summary>
    ///     Returns the fraction of retrieved chunks whose <see cref="RetrievalHit.SourceId" /> or title appears in
    ///     <paramref name="agentOutputText" /> (case-insensitive substring match).
    /// </summary>
    public static RetrievalFaithfulnessReport Evaluate(
        IReadOnlyList<RetrievalHit> hits,
        string agentOutputText)
    {
        ArgumentNullException.ThrowIfNull(hits);

        if (hits.Count == 0)
        {
            return new RetrievalFaithfulnessReport(0, 0, 1d, []);
        }

        string normalizedOutput = agentOutputText ?? string.Empty;
        List<string> unsupported = [];
        int supported = 0;

        foreach (RetrievalHit hit in hits)
        {
            bool cited = ContainsCitation(normalizedOutput, hit.SourceId)
                         || ContainsCitation(normalizedOutput, hit.Title);

            if (cited)
            {
                supported++;
                continue;
            }

            if (!string.IsNullOrWhiteSpace(hit.SourceId))
                unsupported.Add(hit.SourceId);
        }

        double ratio = supported / (double)hits.Count;

        return new RetrievalFaithfulnessReport(hits.Count, supported, ratio, unsupported);
    }

    private static bool ContainsCitation(string output, string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return false;

        return output.Contains(token, StringComparison.OrdinalIgnoreCase);
    }
}
