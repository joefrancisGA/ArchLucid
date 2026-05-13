using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Text;

namespace ArchLucid.Analyzers;

internal static class MutatingControllerAuditAllowlist
{
    internal const string AllowlistFileName = "controller_action_audit_allowlist.txt";

    internal static ImmutableHashSet<string> ReadFqAllowlistEntries(
        AnalyzerOptions analyzerOptions,
        CancellationToken cancellationToken)
    {
        ImmutableHashSet<string>.Builder merged =
            ImmutableHashSet.CreateBuilder(StringComparer.Ordinal);

        foreach (var text in (from additionalText in analyzerOptions.AdditionalFiles where IsAllowlistAdditionalFile(additionalText.Path) select additionalText.GetText(cancellationToken)).OfType<SourceText>())
        {
            AppendAllowlistFqLines(text, merged);
        }

        return merged.ToImmutable();
    }

    private static bool IsAllowlistAdditionalFile(string path) =>
        string.Equals(Path.GetFileName(path), AllowlistFileName, StringComparison.OrdinalIgnoreCase);

    private static void AppendAllowlistFqLines(SourceText contents, ImmutableHashSet<string>.Builder merged)
    {
        foreach (TextLine line in contents.Lines)
        {
            string raw = contents.ToString(line.Span).TrimEnd();

            raw = TrimLineComment(raw.TrimStart());

            if (raw.Length == 0)
                continue;

            if (raw[0] == '#')
                continue;

            merged.Add(raw);
        }
    }

    private static string TrimLineComment(string raw)
    {
        int chop = raw.IndexOf("//", StringComparison.Ordinal);

        return chop >= 0 ? raw.Substring(0, chop).Trim() : raw;
    }
}
