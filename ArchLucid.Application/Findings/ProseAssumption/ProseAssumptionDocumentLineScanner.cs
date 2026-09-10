using System.Text.RegularExpressions;

using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Findings.ProseAssumption;

/// <summary>Deterministically extracts mappable architecture assumptions from in-batch prose documents (DX-55).</summary>
public static class ProseAssumptionDocumentLineScanner
{
    private static readonly Regex MustNotBePublicPattern = new(
        @"\b(must not|shall not|should not)\s+be\s+public\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly Regex NotPubliclyAccessiblePattern = new(
        @"\b(not|never)\s+(?:be\s+)?publicly\s+accessible\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public static IReadOnlyList<ProseAssumptionCandidate> Scan(
        IReadOnlyList<ContextDocumentRequest> documents,
        int maxCandidates)
    {
        ArgumentNullException.ThrowIfNull(documents);

        if (maxCandidates <= 0)
            return [];

        List<ProseAssumptionCandidate> candidates = [];

        foreach (ContextDocumentRequest document in documents)
        {
            if (string.IsNullOrWhiteSpace(document.Name) || string.IsNullOrWhiteSpace(document.Content))
                continue;

            string[] lines = document.Content.Split('\n');

            for (int lineIndex = 0; lineIndex < lines.Length; lineIndex++)
            {
                if (candidates.Count >= maxCandidates)
                    return candidates;

                string line = lines[lineIndex];
                TryAddPublicAccessCandidate(document.Name, line, lineIndex + 1, candidates, maxCandidates);
            }
        }

        return candidates;
    }

    private static void TryAddPublicAccessCandidate(
        string documentPath,
        string line,
        int lineNumber,
        List<ProseAssumptionCandidate> candidates,
        int maxCandidates)
    {
        Match? match = MustNotBePublicPattern.Match(line);

        if (!match.Success)
            match = NotPubliclyAccessiblePattern.Match(line);

        if (!match.Success)
            return;

        if (candidates.Count >= maxCandidates)
            return;

        string quotedSpan = match.Value;

        candidates.Add(new ProseAssumptionCandidate
        {
            Statement = line.Trim(),
            DocumentPath = documentPath,
            LineNumber = lineNumber,
            QuotedSpan = quotedSpan,
            LogicalPropertyName = DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            ImpliedPropertyValue = "Disabled",
        });
    }
}
