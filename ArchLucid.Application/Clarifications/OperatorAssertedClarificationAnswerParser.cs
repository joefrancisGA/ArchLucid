using System.Text.RegularExpressions;

namespace ArchLucid.Application.Clarifications;

/// <summary>Parses operator-asserted clarification answers from assumption strings.</summary>
public static partial class OperatorAssertedClarificationAnswerParser
{
    [GeneratedRegex(
        @"^\[finding-clarification\]\s+(?<answer>.+?)\s+\[q=(?<id>[a-f0-9]{16})\]$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ClarificationAnswerRegex();

    public static bool TryParse(string assumption, out ParsedClarificationAnswer parsed)
    {
        parsed = default;

        if (string.IsNullOrWhiteSpace(assumption))
            return false;

        Match match = ClarificationAnswerRegex().Match(assumption.Trim());

        if (!match.Success)
            return false;

        string questionId = match.Groups["id"].Value.ToLowerInvariant();
        string answer = match.Groups["answer"].Value.Trim();

        if (answer.Length == 0)
            return false;

        parsed = new ParsedClarificationAnswer(questionId, answer);

        return true;
    }

    public static IReadOnlyList<string> ExtractQuestionIds(IEnumerable<string> assumptions)
    {
        ArgumentNullException.ThrowIfNull(assumptions);

        HashSet<string> ids = new(StringComparer.Ordinal);

        foreach (string assumption in assumptions)
        {
            if (!TryParse(assumption, out ParsedClarificationAnswer parsed))
                continue;

            ids.Add(parsed.QuestionId);
        }

        return ids.OrderBy(static id => id, StringComparer.Ordinal).ToList();
    }
}

public readonly record struct ParsedClarificationAnswer(string QuestionId, string Answer);
