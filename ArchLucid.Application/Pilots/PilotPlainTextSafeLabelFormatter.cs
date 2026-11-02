namespace ArchLucid.Application.Pilots;

/// <summary>SQL-style single-quote wrapping for sponsor PDF plain-text labels that may contain punctuation.</summary>
internal static class PilotPlainTextSafeLabelFormatter
{
    internal static string FormatLabel(string value)
    {
        if (string.IsNullOrEmpty(value))
            return "''";

        if (LabelNeedsQuoting(value))
            return $"'{value.Replace("'", "''", StringComparison.Ordinal)}'";

        return value;
    }

    private static bool LabelNeedsQuoting(string value) =>
        value.AsSpan().IndexOfAny("|,:'\r\n`") >= 0;
}
