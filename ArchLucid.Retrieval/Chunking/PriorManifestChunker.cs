namespace ArchLucid.Retrieval.Chunking;

/// <summary>
///     Chunks prior-manifest decision and finding text for embedding (compact records stay single-chunk).
/// </summary>
public sealed class PriorManifestChunker : ITextChunker
{
    private const int DefaultMaxChars = 800;
    private const int DefaultOverlap = 100;

    private readonly SimpleTextChunker _fallback = new();

    /// <inheritdoc />
    public IReadOnlyList<string> Chunk(string text, int maxChars = DefaultMaxChars, int overlap = DefaultOverlap)
    {
        if (string.IsNullOrWhiteSpace(text))
            return [];

        string trimmed = text.Trim();

        if (trimmed.Length <= maxChars)
            return [trimmed];

        return _fallback.Chunk(trimmed, maxChars, overlap);
    }
}
