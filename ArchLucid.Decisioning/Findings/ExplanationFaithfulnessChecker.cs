using ArchLucid.Core.Explanation;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Token-overlap heuristic: explanation word-like tokens are checked for substring presence in a flattened trace
///     corpus.
///     False negatives are common (paraphrases); false positives possible on short tokens shared with trace text.
/// </summary>
public sealed class ExplanationFaithfulnessChecker : IExplanationFaithfulnessChecker
{
    private const int MaxUnsupportedListed = 32;

    /// <inheritdoc />
    public ExplanationFaithfulnessReport CheckFaithfulness(ExplanationResult explanation, FindingsSnapshot? snapshot)
    {
        ArgumentNullException.ThrowIfNull(explanation);

        if (snapshot is null || snapshot.Findings.Count == 0)
            return new ExplanationFaithfulnessReport(0, 0, 0, 1.0, []);

        string traceBlob = ExplanationFaithfulnessTraceCorpusBuilder.BuildTraceBlob(snapshot);
        string explanationBlob = ExplanationFaithfulnessTraceCorpusBuilder.BuildExplanationBlob(explanation);

        if (string.IsNullOrWhiteSpace(explanationBlob))
            return new ExplanationFaithfulnessReport(0, 0, 0, 1.0, []);

        HashSet<string> distinctTokens = ExplanationFaithfulnessTokenExtractor.CollectTokens(explanationBlob);

        if (distinctTokens.Count == 0)
            return new ExplanationFaithfulnessReport(0, 0, 0, 1.0, []);

        int supported = 0;
        List<string> unsupported = [];

        foreach (string token in distinctTokens)

            if (traceBlob.Contains(token, StringComparison.OrdinalIgnoreCase))

                supported++;

            else if (unsupported.Count < MaxUnsupportedListed)

                unsupported.Add(token);

        int checkedCount = distinctTokens.Count;
        int unsupportedCount = checkedCount - supported;
        double ratio = checkedCount > 0 ? (double)supported / checkedCount : 1.0;

        return new ExplanationFaithfulnessReport(
            checkedCount,
            supported,
            unsupportedCount,
            ratio,
            unsupported);
    }
}
