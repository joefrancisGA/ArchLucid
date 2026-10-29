using System.Text.RegularExpressions;

using ArchLucid.Core.Retrieval;

namespace ArchLucid.Retrieval.Citations;

/// <inheritdoc cref="IRetrievalCitationFormatter" />
public sealed partial class RetrievalCitationFormatter : IRetrievalCitationFormatter
{
    /// <inheritdoc />
    public string Format(RetrievalHit hit)
    {
        ArgumentNullException.ThrowIfNull(hit);

        string corpus = FormatCorpusKind(hit.CorpusKind);
        string id = string.IsNullOrWhiteSpace(hit.SourceId) ? hit.ChunkId : hit.SourceId.Trim();
        string version = TryExtractVersion(hit.Text) ?? "1";

        return $"[{corpus}]/[{id}]@{version}";
    }

    private static string FormatCorpusKind(string? corpusKind)
    {
        if (string.IsNullOrWhiteSpace(corpusKind))
            return "Corpus kind was not stored.";

        string trimmed = corpusKind.Trim();

        return string.Equals(trimmed, "Unknown", StringComparison.OrdinalIgnoreCase)
            ? "Corpus kind was not stored."
            : trimmed;
    }

    private static string? TryExtractVersion(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return null;

        Match match = VersionInBracketRegex().Match(text);

        if (!match.Success)
            return null;

        return match.Groups["version"].Value.Trim();
    }

    [GeneratedRegex(@"\[[^\]]+\s+v(?<version>[^\]]+)\]", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex VersionInBracketRegex();
}
