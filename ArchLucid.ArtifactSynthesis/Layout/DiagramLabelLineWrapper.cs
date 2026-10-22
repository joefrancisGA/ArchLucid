namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>Wraps diagram labels on hyphens, middots, and spaces so long Azure names stay readable.</summary>
public static class DiagramLabelLineWrapper
{
    public static IReadOnlyList<string> Wrap(string text, int maxWidthPx, double characterWidth)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return [string.Empty];
        }

        int maxChars = Math.Max(8, (int)Math.Floor(maxWidthPx / Math.Max(1.0, characterWidth)));

        if (text.Length <= maxChars)
        {
            return [text];
        }

        List<string> tokens = Tokenize(text);
        List<string> lines = [];
        string current = string.Empty;

        foreach (string token in tokens)
        {
            if (token.Length > maxChars)
            {

                if (current.Length > 0)
                {
                    lines.Add(current);
                    current = string.Empty;
                }

                foreach (string chunk in HardSplit(token, maxChars))
                {
                    lines.Add(chunk);
                }

                continue;
            }

            string candidate = current.Length == 0 ? token : current + token;

            if (candidate.Length <= maxChars)
            {
                current = candidate;
                continue;
            }

            if (current.Length > 0)
            {
                lines.Add(current.TrimEnd());
            }

            current = token.TrimStart();
        }

        if (current.Length > 0)
        {
            lines.Add(current.TrimEnd());
        }

        return lines.Count == 0 ? [text] : lines;
    }

    private static List<string> Tokenize(string text)
    {
        List<string> tokens = [];
        string remaining = text;

        while (remaining.Length > 0)
        {
            int splitAt = IndexOfBreak(remaining);

            if (splitAt < 0)
            {
                tokens.Add(remaining);
                break;
            }

            tokens.Add(remaining[..(splitAt + 1)]);
            remaining = remaining[(splitAt + 1)..];
        }

        return tokens;
    }

    private static int IndexOfBreak(string text)
    {
        if (text.Length <= 1)
        {
            return -1;
        }

        for (int index = 0; index < text.Length - 1; index++)
        {
            char current = text[index];

            if (current is '-' or ' ' or '·')
            {
                return index;
            }
        }

        return -1;
    }

    private static IReadOnlyList<string> HardSplit(string token, int maxChars)
    {
        List<string> chunks = [];

        for (int index = 0; index < token.Length; index += maxChars)
        {
            int length = Math.Min(maxChars, token.Length - index);
            chunks.Add(token.Substring(index, length));
        }

        return chunks;
    }
}
