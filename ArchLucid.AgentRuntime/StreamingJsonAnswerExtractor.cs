using System.Globalization;
using System.Text;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Incrementally extracts the <c>answer</c> string from a partial JSON object as LLM tokens arrive.
/// </summary>
public sealed class StreamingJsonAnswerExtractor
{
    private readonly StringBuilder _buffer = new();
    private string _lastAnswer = string.Empty;

    /// <summary>Appends a raw JSON chunk and returns newly visible answer text (may be empty).</summary>
    public string AppendChunkAndTakeAnswerDelta(string chunk)
    {
        if (string.IsNullOrEmpty(chunk))
            return string.Empty;

        _buffer.Append(chunk);
        string? answer = TryExtractAnswerValue(_buffer.ToString());

        if (answer is null)
            return string.Empty;

        if (answer.Length <= _lastAnswer.Length)
            return string.Empty;

        string delta = answer[_lastAnswer.Length..];
        _lastAnswer = answer;

        return delta;
    }

    /// <summary>Full assistant JSON accumulated so far.</summary>
    public string RawJson => _buffer.ToString();

    /// <summary>Resets extractor state for a new stream.</summary>
    public void Reset()
    {
        _buffer.Clear();
        _lastAnswer = string.Empty;
    }

    /// <summary>
    ///     Best-effort parse of the <c>answer</c> property from incomplete JSON. Returns <see langword="null" /> until the
    ///     opening quote of the value is seen.
    /// </summary>
    internal static string? TryExtractAnswerValue(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        ReadOnlySpan<char> span = json.AsSpan();
        int start = SkipJsonWhitespace(span, 0);
        if (start >= span.Length || span[start] != '{')
            return null;

        int depth = 1;
        for (int cursor = start + 1; cursor < span.Length; cursor++)
        {
            if (span[cursor] == '"')
            {
                int end = FindStringEnd(span, cursor + 1);
                if (end < 0)
                    return null;

                int separator = SkipJsonWhitespace(span, end + 1);
                if (depth == 1 && separator < span.Length && span[separator] == ':'
                    && span[(cursor + 1)..end].Equals("answer", StringComparison.OrdinalIgnoreCase))
                {
                    int valueStart = SkipJsonWhitespace(span, separator + 1);
                    return valueStart < span.Length && span[valueStart] == '"'
                        ? ReadAnswerPrefix(span, valueStart + 1)
                        : null;
                }

                cursor = end;
                continue;
            }

            if (span[cursor] is '{' or '[')
                depth++;
            else if (span[cursor] is '}' or ']')
            {
                if (--depth == 0)
                    return null;
            }
        }

        return null;
    }

    private static int FindStringEnd(ReadOnlySpan<char> span, int start)
    {
        for (int i = start; i < span.Length; i++)
        {
            if (span[i] == '\\')
                i++;
            else if (span[i] == '"')
                return i;
        }

        return -1;
    }

    private static string? ReadAnswerPrefix(ReadOnlySpan<char> span, int cursor)
    {
        StringBuilder value = new();
        while (cursor < span.Length)
        {
            char current = span[cursor++];
            if (current == '"')
                return value.ToString();

            if (current == '\\')
            {
                if (cursor >= span.Length)
                    break;

                char escaped = span[cursor++];
                if (escaped == 'u')
                {
                    if (!TryReadHexChar(span, ref cursor, out current))
                        break;

                    if (char.IsHighSurrogate(current))
                    {
                        if (span.Length - cursor < 2 || span[cursor] != '\\' || span[cursor + 1] != 'u')
                            break;

                        cursor += 2;
                        if (!TryReadHexChar(span, ref cursor, out char low) || !char.IsLowSurrogate(low))
                            break;

                        value.Append(current).Append(low);
                        continue;
                    }
                }
                else
                {
                    current = UnescapeJsonChar(escaped);
                    if (current == '\0')
                        break;
                }
            }
            else if (char.IsHighSurrogate(current))
            {
                if (cursor >= span.Length || !char.IsLowSurrogate(span[cursor]))
                    break;

                value.Append(current).Append(span[cursor++]);
                continue;
            }

            if (char.IsLowSurrogate(current))
                break;

            value.Append(current);
        }

        // Incomplete escapes and surrogate pairs must not emit provisional characters.
        return value.Length > 0 ? value.ToString() : null;
    }

    private static bool TryReadHexChar(ReadOnlySpan<char> span, ref int cursor, out char result)
    {
        result = default;
        if (span.Length - cursor < 4 || !ushort.TryParse(span.Slice(cursor, 4),
                NumberStyles.AllowHexSpecifier, CultureInfo.InvariantCulture, out ushort codeUnit))
            return false;

        cursor += 4;
        result = (char)codeUnit;
        return true;
    }

    private static int SkipJsonWhitespace(ReadOnlySpan<char> span, int start)
    {
        int i = start;

        while (i < span.Length && char.IsWhiteSpace(span[i]))
            i++;

        return i;
    }

    private static char UnescapeJsonChar(char escaped) =>
        escaped switch
        {
            '"' => '"',
            '\\' => '\\',
            '/' => '/',
            'b' => '\b',
            'f' => '\f',
            'n' => '\n',
            'r' => '\r',
            't' => '\t',
            _ => '\0'
        };
}
