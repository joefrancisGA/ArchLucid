using ArchLucid.Retrieval.Embedding;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>Compares configured embedding identity with stored index metadata (TB-045).</summary>
public static class RetrievalEmbeddingDriftGuard
{
    /// <summary>
    ///     Returns an actionable error when <paramref name="indexMetadata" /> disagrees with
    ///     <paramref name="configuredIdentity" />; otherwise <see langword="null" />.
    /// </summary>
    public static string? TryBuildDriftErrorMessage(
        VectorIndexEmbeddingMetadata indexMetadata,
        IEmbeddingModelIdentity configuredIdentity)
    {
        ArgumentNullException.ThrowIfNull(indexMetadata);
        ArgumentNullException.ThrowIfNull(configuredIdentity);

        if (indexMetadata.ChunkCount <= 0)
            return null;

        bool modelMismatch = !string.Equals(
            indexMetadata.ModelId,
            configuredIdentity.ModelId,
            StringComparison.OrdinalIgnoreCase);

        bool dimensionMismatch = indexMetadata.Dimension != configuredIdentity.ExpectedDimension;

        if (!modelMismatch && !dimensionMismatch)
            return null;

        return
            "Retrieval embedding drift detected: "
            + $"index has model '{indexMetadata.ModelId}' dimension {indexMetadata.Dimension} "
            + $"but configuration expects model '{configuredIdentity.ModelId}' dimension {configuredIdentity.ExpectedDimension}. "
            + "Clear the vector index or re-index all corpora after changing AzureOpenAI:EmbeddingDeploymentName "
            + "or Retrieval:EmbeddingModel:ExpectedDimension.";
    }
}
