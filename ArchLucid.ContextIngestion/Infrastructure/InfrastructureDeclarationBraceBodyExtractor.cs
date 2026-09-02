namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Extracts balanced <c>{ ... }</c> bodies from infrastructure declaration source text.
/// </summary>
internal static class InfrastructureDeclarationBraceBodyExtractor
{
    internal static string ExtractBalancedBraceBody(string content, int searchStartIndex)
    {
        if (string.IsNullOrEmpty(content) || searchStartIndex < 0 || searchStartIndex >= content.Length)
            return string.Empty;

        int openBraceIndex = content.IndexOf('{', searchStartIndex);

        if (openBraceIndex < 0)
            return string.Empty;

        int depth = 0;
        bool inDoubleQuotes = false;
        bool inSingleQuotes = false;

        for (int index = openBraceIndex; index < content.Length; index++)
        {
            char character = content[index];

            if (character == '"' && !inSingleQuotes)
                inDoubleQuotes = !inDoubleQuotes;

            if (character == '\'' && !inDoubleQuotes)
                inSingleQuotes = !inSingleQuotes;

            if (inDoubleQuotes || inSingleQuotes)
                continue;

            if (character == '{')
            {
                depth++;
            }
            else if (character == '}')
            {
                depth--;

                if (depth == 0)
                    return content[openBraceIndex..(index + 1)];
            }
        }

        return string.Empty;
    }

    internal static string ExtractBalancedBracketBody(string content, int searchStartIndex)
    {
        if (string.IsNullOrEmpty(content) || searchStartIndex < 0 || searchStartIndex >= content.Length)
            return string.Empty;

        int openBracketIndex = content.IndexOf('[', searchStartIndex);

        if (openBracketIndex < 0)
            return string.Empty;

        int depth = 0;
        bool inDoubleQuotes = false;
        bool inSingleQuotes = false;

        for (int index = openBracketIndex; index < content.Length; index++)
        {
            char character = content[index];

            if (character == '"' && !inSingleQuotes)
                inDoubleQuotes = !inDoubleQuotes;

            if (character == '\'' && !inDoubleQuotes)
                inSingleQuotes = !inSingleQuotes;

            if (inDoubleQuotes || inSingleQuotes)
                continue;

            if (character == '[')
            {
                depth++;
            }
            else if (character == ']')
            {
                depth--;

                if (depth == 0)
                    return content[openBracketIndex..(index + 1)];
            }
        }

        return string.Empty;
    }
}
