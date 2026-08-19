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
        int searchFrom = 0;

        while (searchFrom < span.Length)
        {
            int keyIndex = IndexOfPropertyKey(span, searchFrom, "answer");

            if (keyIndex < 0)
                return null;

            int cursor = keyIndex + "answer".Length;

            if (cursor < span.Length && span[cursor] == '"')
                cursor++;

            cursor = SkipJsonWhitespace(span, cursor);

            if (cursor >= span.Length || span[cursor] != ':')
            {
                searchFrom = keyIndex + 1;
                continue;
            }

            cursor++;
            cursor = SkipJsonWhitespace(span, cursor);

            if (cursor >= span.Length || span[cursor] != '"')
                return null;

            cursor++;

            StringBuilder value = new();
            bool complete = false;

            while (cursor < span.Length)
            {
                char c = span[cursor];

                if (c == '\\')
                {
                    cursor++;

                    if (cursor >= span.Length)
                        break;

                    char escaped = span[cursor];
                    value.Append(UnescapeJsonChar(escaped));
                    cursor++;
                    continue;
                }

                if (c == '"')
                {
                    complete = true;
                    break;
                }

                value.Append(c);
                cursor++;
            }

            return complete || value.Length > 0 ? value.ToString() : null;
        }

        return null;
    }

    private static int IndexOfPropertyKey(ReadOnlySpan<char> span, int start, string key)
    {
        ReadOnlySpan<char> keySpan = key.AsSpan();

        for (int i = start; i <= span.Length - keySpan.Length - 1; i++)
        {
            if (span[i] != '"')
                continue;

            if (!span.Slice(i + 1, keySpan.Length).Equals(keySpan, StringComparison.OrdinalIgnoreCase))
                continue;

            int afterKey = i + 1 + keySpan.Length;

            if (afterKey < span.Length && span[afterKey] == '"')
                return i + 1;
        }

        return -1;
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
            _ => escaped
        };
}
