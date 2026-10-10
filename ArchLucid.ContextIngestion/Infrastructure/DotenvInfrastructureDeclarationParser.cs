using System.Text;

using ArchLucid.ContextIngestion.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Parses uploaded <c>.env</c> / <c>.env.example</c> extracts into proposed connection edges (SN-RT-09).
/// </summary>
public sealed class DotenvInfrastructureDeclarationParser(
    ILogger<DotenvInfrastructureDeclarationParser> logger) : IInfrastructureDeclarationParser
{
    public bool CanParse(string format)
    {
        return string.Equals(format?.Trim(), "dotenv", StringComparison.OrdinalIgnoreCase);
    }

    public Task<IReadOnlyList<CanonicalObject>> ParseAsync(
        InfrastructureDeclarationReference declaration,
        CancellationToken ct)
    {
        _ = ct;

        if (string.IsNullOrWhiteSpace(declaration.Content))
        {
            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        if (declaration.Content.Length > UploadedConfigProposedEdgeEmitter.MaxContentLength)
        {
            logger.LogWarning(
                "Infrastructure declaration '{Name}' (dotenv) exceeds size cap ({MaxLength}); skipping.",
                declaration.Name,
                UploadedConfigProposedEdgeEmitter.MaxContentLength);

            return Task.FromResult<IReadOnlyList<CanonicalObject>>([]);
        }

        List<CanonicalObject> results = [];

        foreach (string rawLine in declaration.Content.Split(
                     ["\n"],
                     StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (rawLine.StartsWith('#'))
            {
                continue;
            }

            int separatorIndex = rawLine.IndexOf('=');

            if (separatorIndex <= 0)
            {
                continue;
            }

            string key = rawLine[..separatorIndex].Trim();

            if (key.StartsWith("export ", StringComparison.OrdinalIgnoreCase))
            {
                key = key["export ".Length..].Trim();
            }

            if (string.IsNullOrWhiteSpace(key))
            {
                continue;
            }

            string value = StripUnquotedInlineComment(rawLine[(separatorIndex + 1)..].Trim());

            bool isDoubleQuoted = value.Length >= 2
                                  && value.StartsWith('"')
                                  && value.EndsWith('"');
            bool isSingleQuoted = value.Length >= 2
                                  && value.StartsWith('\'')
                                  && value.EndsWith('\'');

            if (isDoubleQuoted || isSingleQuoted)
            {
                value = value[1..^1];

                if (isDoubleQuoted)
                    value = UnescapeDoubleQuotedValue(value);
            }

            UploadedConfigProposedEdgeEmitter.EmitFromStringValue(
                results,
                declaration,
                "dotenv",
                key,
                value);
        }

        return Task.FromResult<IReadOnlyList<CanonicalObject>>(results);
    }

    /// <summary>
    ///     Shell dotenv comments begin at an unquoted <c>#</c> that is preceded by whitespace.
    ///     A hash inside a URL fragment or a quoted value stays in the setting.
    /// </summary>
    private static string StripUnquotedInlineComment(string value)
    {
        bool inSingleQuotes = false;
        bool inDoubleQuotes = false;

        for (int index = 0; index < value.Length; index++)
        {
            char current = value[index];

            // Escaped quotes are literal dotenv content and must not change the quote state.
            if ((current == '"' || current == '\'') && IsEscaped(value, index))
                continue;

            if (current == '"' && !inSingleQuotes)
            {
                inDoubleQuotes = !inDoubleQuotes;

                continue;
            }

            if (current == '\'' && !inDoubleQuotes)
            {
                inSingleQuotes = !inSingleQuotes;

                continue;
            }

            if (inSingleQuotes || inDoubleQuotes || current != '#')
                continue;

            if (index > 0 && !char.IsWhiteSpace(value[index - 1]))
                continue;

            int commentStart = index == 0 ? 0 : index - 1;

            return value[..commentStart].TrimEnd();
        }

        return value;
    }

    private static bool IsEscaped(string value, int index)
    {
        int backslashCount = 0;

        for (int precedingIndex = index - 1;
             precedingIndex >= 0 && value[precedingIndex] == '\\';
             precedingIndex--)
        {
            backslashCount++;
        }

        return backslashCount % 2 == 1;
    }

    private static string UnescapeDoubleQuotedValue(string value)
    {
        if (!value.Contains('\\'))
            return value;

        StringBuilder unescaped = new(value.Length);

        for (int index = 0; index < value.Length; index++)
        {
            char current = value[index];

            if (current != '\\' || index == value.Length - 1)
            {
                unescaped.Append(current);

                continue;
            }

            char escaped = value[++index];

            switch (escaped)
            {
                case 'n':
                    unescaped.Append('\n');

                    break;
                case 'r':
                    unescaped.Append('\r');

                    break;
                case 't':
                    unescaped.Append('\t');

                    break;
                case '"':
                case '\\':
                case '$':
                    unescaped.Append(escaped);

                    break;
                default:
                    unescaped.Append('\\');
                    unescaped.Append(escaped);

                    break;
            }
        }

        return unescaped.ToString();
    }
}
