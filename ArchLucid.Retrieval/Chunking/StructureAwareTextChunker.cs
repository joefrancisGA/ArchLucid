namespace ArchLucid.Retrieval.Chunking;

/// <summary>
///     Splits on markdown headings, fenced code blocks, and paragraph boundaries before character-window fallback.
/// </summary>
public sealed class StructureAwareTextChunker : ITextChunker
{
    private const int DefaultMaxChars = 1200;
    private const int DefaultOverlap = 150;

    private readonly SimpleTextChunker _fallback = new();

    /// <inheritdoc />
    public IReadOnlyList<string> Chunk(string text, int maxChars = DefaultMaxChars, int overlap = DefaultOverlap)
    {
        if (string.IsNullOrWhiteSpace(text))
            return [];

        string trimmed = text.Trim();

        if (trimmed.Length <= maxChars)
            return [trimmed];

        IReadOnlyList<string> segments = SplitStructuralSegments(trimmed);
        List<string> packed = PackSegments(segments, maxChars);
        List<string> chunks = [];

        foreach (string segment in packed)
        {
            if (string.IsNullOrWhiteSpace(segment))
                continue;

            if (segment.Length <= maxChars)
            {
                chunks.Add(segment.Trim());
                continue;
            }

            if (TryChunkOversizedCodeFence(segment, maxChars, overlap, out IReadOnlyList<string> fenceChunks))
            {
                chunks.AddRange(fenceChunks);
                continue;
            }

            chunks.AddRange(_fallback.Chunk(segment, maxChars, overlap));
        }

        return chunks;
    }

    private static IReadOnlyList<string> SplitStructuralSegments(string text)
    {
        List<string> segments = [];
        List<string> lines = text.Split('\n').ToList();
        List<string> buffer = [];
        bool inCodeFence = false;

        for (int i = 0; i < lines.Count; i++)
        {
            string line = lines[i];
            string trimmedLine = line.Trim();

            if (IsCodeFenceDelimiter(trimmedLine))
            {
                if (!inCodeFence)
                {
                    FlushBuffer(segments, buffer);
                    buffer.Add(line);
                    inCodeFence = true;
                    continue;
                }

                buffer.Add(line);
                FlushBuffer(segments, buffer);
                inCodeFence = false;
                continue;
            }

            if (inCodeFence)
            {
                buffer.Add(line);
                continue;
            }

            if (IsMarkdownHeading(trimmedLine))
            {
                FlushBuffer(segments, buffer);
                buffer.Add(line);
                continue;
            }

            if (string.IsNullOrWhiteSpace(trimmedLine))
            {
                if (buffer.Count == 1 && IsMarkdownHeading(buffer[0].Trim()))
                    continue;

                FlushBuffer(segments, buffer);
                continue;
            }

            buffer.Add(line);
        }

        FlushBuffer(segments, buffer);

        return segments;
    }

    private static List<string> PackSegments(IReadOnlyList<string> segments, int maxChars)
    {
        List<string> packed = [];
        List<string> current = [];
        int currentLength = 0;

        foreach (string segment in segments)
        {
            string trimmed = segment.Trim();

            if (string.IsNullOrWhiteSpace(trimmed))
                continue;

            int separatorLength = current.Count > 0 ? 2 : 0;
            int projected = currentLength + separatorLength + trimmed.Length;

            if (current.Count > 0 && projected > maxChars)
            {
                packed.Add(string.Join("\n\n", current));
                current = [trimmed];
                currentLength = trimmed.Length;
                continue;
            }

            current.Add(trimmed);
            currentLength = projected;
        }

        if (current.Count > 0)
            packed.Add(string.Join("\n\n", current));

        return packed;
    }

    private static void FlushBuffer(List<string> segments, List<string> buffer)
    {
        if (buffer.Count == 0)
            return;

        string segment = string.Join('\n', buffer).Trim();

        if (!string.IsNullOrWhiteSpace(segment))
            segments.Add(segment);

        buffer.Clear();
    }

    private bool TryChunkOversizedCodeFence(
        string segment,
        int maxChars,
        int overlap,
        out IReadOnlyList<string> chunks)
    {
        chunks = [];

        string trimmed = segment.Trim();
        List<string> lines = trimmed.Split('\n').ToList();

        if (lines.Count < 3)
            return false;

        string opener = lines[0].Trim();
        string closer = lines[^1].Trim();

        if (!IsCodeFenceDelimiter(opener) || !IsCodeFenceDelimiter(closer))
            return false;

        string inner = string.Join('\n', lines.Skip(1).Take(lines.Count - 2));

        if (string.IsNullOrEmpty(inner))
            return false;

        int wrapOverhead = opener.Length + closer.Length + 2;

        if (wrapOverhead >= maxChars)
            return false;

        int innerBudget = maxChars - wrapOverhead;
        IReadOnlyList<string> innerChunks = _fallback.Chunk(inner, innerBudget, overlap);
        List<string> wrapped = [];

        foreach (string innerChunk in innerChunks)
        {
            if (string.IsNullOrWhiteSpace(innerChunk))
                continue;

            wrapped.Add($"{opener}\n{innerChunk.Trim()}\n{closer}");
        }

        if (wrapped.Count == 0)
            return false;

        chunks = wrapped;
        return true;
    }

    private static bool IsMarkdownHeading(string trimmedLine)
    {
        if (trimmedLine.Length < 2 || trimmedLine[0] != '#')
            return false;

        int index = 0;

        while (index < trimmedLine.Length && trimmedLine[index] == '#')
        {
            index++;

            if (index > 6)
                return false;
        }

        return index < trimmedLine.Length && char.IsWhiteSpace(trimmedLine[index]);
    }

    private static bool IsCodeFenceDelimiter(string trimmedLine)
    {
        return trimmedLine.StartsWith("```", StringComparison.Ordinal);
    }
}
