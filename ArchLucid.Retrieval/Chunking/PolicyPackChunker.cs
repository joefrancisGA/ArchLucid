namespace ArchLucid.Retrieval.Chunking;

/// <summary>
///     Splits policy-pack rule text into semantic chunks (header line + sentence windows for long descriptions).
/// </summary>
public sealed class PolicyPackChunker : ITextChunker
{
    private const int DefaultMaxChars = 900;
    private const int DefaultOverlap = 120;

    private readonly SimpleTextChunker _fallback = new();

    /// <inheritdoc />
    public IReadOnlyList<string> Chunk(string text, int maxChars = DefaultMaxChars, int overlap = DefaultOverlap)
    {
        if (string.IsNullOrWhiteSpace(text))
            return [];

        string trimmed = text.Trim();

        if (trimmed.Length <= maxChars)
            return [trimmed];

        int headerEnd = trimmed.IndexOf(':');

        if (headerEnd < 0 || headerEnd >= trimmed.Length - 1)
            return _fallback.Chunk(trimmed, maxChars, overlap);

        string header = trimmed[..(headerEnd + 1)].Trim();
        string body = trimmed[(headerEnd + 1)..].Trim();

        if (string.IsNullOrWhiteSpace(body))
            return [header];

        List<string> bodyChunks = SplitSentences(body, maxChars - header.Length - 1, overlap);
        List<string> chunks = [];

        foreach (string bodyChunk in bodyChunks)
        {
            string combined = $"{header} {bodyChunk}".Trim();

            if (!string.IsNullOrWhiteSpace(combined))
                chunks.Add(combined);
        }

        return chunks.Count > 0 ? chunks : [trimmed];
    }

    private static List<string> SplitSentences(string body, int maxChars, int overlap)
    {
        if (body.Length <= maxChars)
            return [body];

        List<string> sentences = [];
        int start = 0;

        while (start < body.Length)
        {
            int end = start;

            while (end < body.Length && end - start < maxChars)
            {
                int nextBreak = FindSentenceBreak(body, end);

                if (nextBreak < 0)
                {
                    end = body.Length;
                    break;
                }

                if (nextBreak - start > maxChars)
                    break;

                end = nextBreak;
            }

            if (end <= start)
                end = Math.Min(body.Length, start + maxChars);

            string slice = body[start..end].Trim();

            if (!string.IsNullOrWhiteSpace(slice))
                sentences.Add(slice);

            if (end >= body.Length)
                break;

            start = Math.Max(start + 1, end - overlap);
        }

        return sentences;
    }

    private static int FindSentenceBreak(string text, int fromIndex)
    {
        for (int i = fromIndex; i < text.Length; i++)
        {
            char c = text[i];

            if (c is '.' or '!' or '?')
                return i + 1;
        }

        return -1;
    }
}
