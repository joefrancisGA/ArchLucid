namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Future hook for embedding-based semantic similarity between agent outputs and reference text.
///     Today, <see cref="IAgentOutputSemanticEvaluator" /> scores persisted JSON in-process; this interface
///     reserves a seam for cosine-similarity or entailment models without coupling the harness to Azure OpenAI embeddings
///     yet.
/// </summary>
public interface ISemanticScorer
{
    /// <summary>
    ///     Returns a score in [0, 1] comparing <paramref name="candidateText" /> to <paramref name="referenceText" />, or
    ///     <see langword="null" /> when scoring is skipped.
    /// </summary>
    double? ScoreSimilarity(string candidateText, string referenceText);
}
