namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Quote-aware block-comment stripping for single-line infrastructure declaration scans.
/// </summary>
internal static class InfrastructureDeclarationLineCommentScanner
{
    internal static bool TryConsumeBlockComment(ref string line, ref bool inBlockComment)
    {
        if (inBlockComment)
        {
            int end = line.IndexOf("*/", StringComparison.Ordinal);

            if (end < 0)
            {
                line = string.Empty;

                return true;
            }

            line = line[(end + 2)..].TrimStart();
            inBlockComment = false;
        }

        while (true)
        {
            int start = IndexOfBlockCommentStartOutsideQuotes(line);

            if (start < 0)
                break;

            int end = line.IndexOf("*/", start + 2, StringComparison.Ordinal);

            if (end < 0)
            {
                line = line[..start].TrimEnd();
                inBlockComment = true;
                break;
            }

            line = string.Concat(line.AsSpan(0, start), line.AsSpan(end + 2)).Trim();
        }

        return string.IsNullOrWhiteSpace(line) && inBlockComment;
    }

    private static int IndexOfBlockCommentStartOutsideQuotes(string line)
    {
        bool inDoubleQuotes = false;
        bool inSingleQuotes = false;

        for (int index = 0; index < line.Length - 1; index++)
        {
            if (inDoubleQuotes && line[index] == '\\' && index + 1 < line.Length)
            {
                index++;

                continue;
            }

            char character = line[index];

            if (character == '"' && !inSingleQuotes)
            {
                inDoubleQuotes = !inDoubleQuotes;

                continue;
            }

            if (character == '\'' && !inDoubleQuotes)
            {
                if (inSingleQuotes && index + 1 < line.Length && line[index + 1] == '\'')
                {
                    index++;

                    continue;
                }

                inSingleQuotes = !inSingleQuotes;

                continue;
            }

            if (character == '/' && line[index + 1] == '*' && !inDoubleQuotes && !inSingleQuotes)
                return index;
        }

        return -1;
    }
}
