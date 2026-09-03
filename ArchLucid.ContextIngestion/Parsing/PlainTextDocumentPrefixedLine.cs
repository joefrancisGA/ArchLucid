namespace ArchLucid.ContextIngestion.Parsing;

/// <summary>Shared <c>REQ:</c> / <c>TOP:</c> prefixed-line parsing for plain-text document parsers.</summary>
internal static class PlainTextDocumentPrefixedLine
{
    public static bool TryGetPrefixedBody(string line, string prefix, out string body)
    {
        body = string.Empty;

        if (line.Length < prefix.Length)
            return false;

        if (!line.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        int index = prefix.Length;

        while (index < line.Length && char.IsWhiteSpace(line[index]))
            index++;

        if (index >= line.Length || line[index] != ':')
            return false;

        index++;
        body = line[index..].Trim();

        return true;
    }
}
