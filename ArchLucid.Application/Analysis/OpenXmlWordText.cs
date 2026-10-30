using System.Text;
using System.Xml;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Drops characters WordprocessingML cannot store so document save does not throw.
/// </summary>
internal static class OpenXmlWordText
{
    internal static string ForXml(string text)
    {
        if (string.IsNullOrEmpty(text))
            return text;

        StringBuilder? sanitized = null;

        for (int index = 0; index < text.Length; index++)
        {
            char current = text[index];

            if (char.IsHighSurrogate(current))
            {
                if (index + 1 < text.Length && char.IsLowSurrogate(text[index + 1]))
                {
                    sanitized?.Append(current);
                    sanitized?.Append(text[index + 1]);
                    index++;
                    continue;
                }

                sanitized ??= CopyValidPrefix(text, index);
                continue;
            }

            if (char.IsLowSurrogate(current) || !XmlConvert.IsXmlChar(current))
            {
                sanitized ??= CopyValidPrefix(text, index);
                continue;
            }

            sanitized?.Append(current);
        }

        return sanitized is null ? text : sanitized.ToString();
    }

    private static StringBuilder CopyValidPrefix(string text, int length)
    {
        StringBuilder builder = new(text.Length);
        builder.Append(text, 0, length);
        return builder;
    }
}
