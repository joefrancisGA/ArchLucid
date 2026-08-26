using ArchLucid.ContextIngestion.Topology;

namespace ArchLucid.ContextIngestion.Parsing;

/// <summary>
///     Extracts canonical topology hint names from plain-text document <c>TOP:</c> lines.
/// </summary>
public static class PlainTextDocumentTopologyHintExtractor
{
    public static IEnumerable<string> EnumerateHintNames(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            yield break;

        if (content[0] == '\uFEFF')
            content = content[1..];

        string[] lines = content
            .Replace("\r\n", "\n")
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (string line in lines)
        {
            if (!line.StartsWith("TOP:", StringComparison.OrdinalIgnoreCase))
                continue;

            string text = line[4..].Trim();

            if (string.IsNullOrWhiteSpace(text))
                continue;

            yield return TopologyHintStableObjectIds.CanonicalizeHintName(text).ToLowerInvariant();
        }
    }
}
