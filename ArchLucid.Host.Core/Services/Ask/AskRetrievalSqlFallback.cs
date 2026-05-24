using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>
///     SQL-backed retrieval fallback when the vector index is unavailable during Ask.
/// </summary>
public static class AskRetrievalSqlFallback
{
    /// <summary>
    ///     Builds plain-text evidence snippets from run findings and manifest summary using simple keyword overlap.
    /// </summary>
    public static string BuildFromRunDetail(RunDetailDto? detail, string question, int maxSnippets = 8)
    {
        if (detail is null || string.IsNullOrWhiteSpace(question))
            return string.Empty;

        string[] keywords = Tokenize(question);

        if (keywords.Length == 0)
            return string.Empty;

        List<(int Score, string Line)> scored = [];

        if (detail.GoldenManifest?.Decisions is { Count: > 0 } decisions)
        {
            foreach (ResolvedArchitectureDecision decision in decisions)
            {
                string text = $"{decision.Title}: {decision.SelectedOption}";

                int score = ScoreText(text, keywords);

                if (score > 0)
                    scored.Add((score, $"Decision: {text.Trim()}"));
            }
        }

        FindingsSnapshot? snapshot = detail.FindingsSnapshot;

        if (snapshot?.Findings is { Count: > 0 })
        {
            foreach (Finding finding in snapshot.Findings)
            {
                if (finding.IsMuted)
                    continue;

                string text = ResolveFindingText(finding);

                if (string.IsNullOrWhiteSpace(text))
                    continue;

                int score = ScoreText(text, keywords);

                if (score <= 0)
                    continue;

                scored.Add((score, $"[{finding.Category}] {finding.Severity}: {text.Trim()}"));
            }
        }

        if (scored.Count == 0)
            return string.Empty;

        return string.Join(
            Environment.NewLine + Environment.NewLine,
            scored
                .OrderByDescending(static x => x.Score)
                .Take(maxSnippets)
                .Select(static (x, i) => $"[{i + 1}] {x.Line}"));
    }

    private static string ResolveFindingText(Finding finding)
    {
        if (!string.IsNullOrWhiteSpace(finding.Rationale))
            return finding.Rationale;

        if (!string.IsNullOrWhiteSpace(finding.Title))
            return finding.Title;

        return string.Empty;
    }

    private static string[] Tokenize(string question) =>
        question
            .Split([' ', '\t', '\r', '\n', ',', '.', '?', '!', ';', ':'], StringSplitOptions.RemoveEmptyEntries)
            .Select(static t => t.Trim())
            .Where(static t => t.Length >= 4)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static int ScoreText(string text, IReadOnlyList<string> keywords)
    {
        int score = 0;

        foreach (string keyword in keywords)
        {
            if (text.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                score++;
        }

        return score;
    }
}
