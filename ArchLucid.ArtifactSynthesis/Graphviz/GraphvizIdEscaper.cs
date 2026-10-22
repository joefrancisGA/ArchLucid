using System.Text;

namespace ArchLucid.ArtifactSynthesis.Graphviz;

public static class GraphvizIdEscaper
{
    public static string EscapeQuotedValue(string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        StringBuilder builder = new(value.Length);

        foreach (char character in value)
        {
            if (character is '"' or '\\')
            {
                builder.Append('\\');
            }
            else if (character is '\r' or '\n')
            {
                builder.Append(' ');
                continue;
            }

            builder.Append(character);
        }

        return builder.ToString();
    }

    public static string QuoteIdentifier(string rawId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rawId);

        return $"\"{EscapeQuotedValue(rawId)}\"";
    }

    public static string QuoteLabel(string label)
    {
        string escaped = EscapeQuotedValue(label);

        if (escaped.Length == 0)
        {
            return "\" \"";
        }

        return $"\"{escaped}\"";
    }

    public static string SanitizeClusterId(string subgraphId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(subgraphId);

        StringBuilder builder = new(subgraphId.Length);

        foreach (char character in subgraphId)
        {
            if (char.IsLetterOrDigit(character) || character is '_')
            {
                builder.Append(character);
            }
            else
            {
                builder.Append('_');
            }
        }

        string sanitized = builder.ToString();

        if (sanitized.Length == 0)
        {
            sanitized = "cluster";
        }

        if (!char.IsLetter(sanitized[0]) && sanitized[0] != '_')
        {
            sanitized = "c_" + sanitized;
        }

        return sanitized;
    }
}
