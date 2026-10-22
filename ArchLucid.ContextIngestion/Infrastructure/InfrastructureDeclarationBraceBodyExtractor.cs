namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Extracts balanced <c>{ ... }</c> and <c>[ ... ]</c> bodies from infrastructure declaration source text.
/// </summary>
internal static class InfrastructureDeclarationBraceBodyExtractor
{
    internal static string ExtractBalancedBraceBody(string content, int searchStartIndex) =>
        ExtractBalancedDelimitedBody(content, searchStartIndex, '{', '}');

    internal static string ExtractBalancedBracketBody(string content, int searchStartIndex) =>
        ExtractBalancedDelimitedBody(content, searchStartIndex, '[', ']');

    private static string ExtractBalancedDelimitedBody(
        string content,
        int searchStartIndex,
        char openDelimiter,
        char closeDelimiter)
    {
        if (string.IsNullOrEmpty(content) || searchStartIndex < 0 || searchStartIndex >= content.Length)
            return string.Empty;

        int openIndex = content.IndexOf(openDelimiter, searchStartIndex);

        if (openIndex < 0)
            return string.Empty;

        int depth = 0;
        bool inDoubleQuotes = false;
        bool inSingleQuotes = false;

        for (int index = openIndex; index < content.Length; index++)
        {
            index = AdvancePastComments(content, index, ref inDoubleQuotes, ref inSingleQuotes);

            if (index >= content.Length)
                break;

            char character = content[index];

            if (inDoubleQuotes && character == '\\' && index + 1 < content.Length)
            {
                index++;
                continue;
            }

            if (character == '"' && !inSingleQuotes)
                inDoubleQuotes = !inDoubleQuotes;

            if (character == '\'' && !inDoubleQuotes)
            {
                if (inSingleQuotes && index + 1 < content.Length && content[index + 1] == '\'')
                {
                    index++;
                    continue;
                }

                inSingleQuotes = !inSingleQuotes;
            }

            if (inDoubleQuotes || inSingleQuotes)
                continue;

            if (character == openDelimiter)
            {
                depth++;
            }
            else if (character == closeDelimiter)
            {
                depth--;

                if (depth == 0)
                    return content[openIndex..(index + 1)];
            }
        }

        return string.Empty;
    }

    private static int AdvancePastComments(
        string content,
        int index,
        ref bool inDoubleQuotes,
        ref bool inSingleQuotes)
    {
        if (index >= content.Length || inDoubleQuotes || inSingleQuotes)
            return index;

        char character = content[index];

        if (character == '/' && index + 1 < content.Length)
        {
            if (content[index + 1] == '*')
            {
                int end = content.IndexOf("*/", index + 2, StringComparison.Ordinal);

                if (end < 0)
                    return content.Length;

                return end + 1;
            }

            if (content[index + 1] == '/')
            {
                int newline = content.IndexOf('\n', index + 2);

                if (newline < 0)
                    return content.Length;

                return newline;
            }
        }

        if (character == '#')
        {
            int newline = content.IndexOf('\n', index + 1);

            if (newline < 0)
                return content.Length;

            return newline;
        }

        return index;
    }
}
