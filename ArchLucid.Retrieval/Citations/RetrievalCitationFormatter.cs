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

        string corpus = string.IsNullOrWhiteSpace(hit.CorpusKind) ? "Unknown" : hit.CorpusKind.Trim();
        string id = string.IsNullOrWhiteSpace(hit.SourceId) ? hit.ChunkId : hit.SourceId.Trim();
        string version = TryExtractVersion(hit.Text) ?? "1";

        return $"[{corpus}]/[{id}]@{version}";
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
