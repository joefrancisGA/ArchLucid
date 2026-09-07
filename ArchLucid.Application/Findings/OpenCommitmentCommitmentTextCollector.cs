using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>Collects searchable text and node-id hints from a source finding and trail event.</summary>
public static partial class OpenCommitmentCommitmentTextCollector
{
    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "access",
        "active",
        "commitment",
        "days",
        "deferred",
        "due",
        "evidence",
        "expired",
        "expiring",
        "finding",
        "network",
        "open",
        "overdue",
        "public",
        "remediation",
        "request",
        "review",
        "risk",
        "still",
        "the",
        "this",
        "unanswered",
        "waiver",
        "was",
        "were",
        "with",
    };

    [GeneratedRegex("'(?<token>[^']+)'|\"(?<token>[^\"]+)\"", RegexOptions.CultureInvariant)]
    private static partial Regex QuotedTokenRegex();

    public static IReadOnlyList<string> CollectTextSegments(
        FindingInspectResponse? inspect,
        FindingReviewEventRecord? trailEvent)
    {
        List<string> segments = [];

        if (inspect is not null)
        {
            AppendTypedPayloadText(inspect.TypedPayload, segments);
            AppendNonEmpty(inspect.ReasoningTrace, segments);
            AppendNonEmpty(inspect.DecisionRuleName, segments);

            foreach (FindingInspectEvidenceItem item in inspect.Evidence)
            {
                AppendNonEmpty(item.Excerpt, segments);
            }

            foreach (string action in inspect.RecommendedActions)
            {
                AppendNonEmpty(action, segments);
            }
        }

        if (trailEvent is not null)
        {
            AppendNonEmpty(trailEvent.Notes, segments);
            AppendNonEmpty(trailEvent.EvidenceRequestText, segments);
        }

        return segments;
    }

    public static IReadOnlyList<string> ExtractResourceTokens(IReadOnlyList<string> textSegments)
    {
        HashSet<string> tokens = new(StringComparer.OrdinalIgnoreCase);

        foreach (string segment in textSegments)
        {
            foreach (Match match in QuotedTokenRegex().Matches(segment))
            {
                AddToken(tokens, match.Groups["token"].Value);
            }

            foreach (string rawToken in SplitTokens(segment))
            {
                AddToken(tokens, rawToken);
            }
        }

        return tokens.ToList();
    }

    public static IReadOnlyList<string> CollectRelatedNodeIdHints(FindingInspectResponse? inspect)
    {
        if (inspect is null)
        {
            return [];
        }

        return inspect.Evidence
            .Select(static item => item.Excerpt?.Trim())
            .Where(static excerpt => !string.IsNullOrWhiteSpace(excerpt))
            .Select(static excerpt => excerpt!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static void AppendTypedPayloadText(JsonElement? typedPayload, List<string> segments)
    {
        if (typedPayload is not JsonElement element || element.ValueKind != JsonValueKind.Object)
        {
            return;
        }

        AppendJsonStringProperty(element, "title", segments);
        AppendJsonStringProperty(element, "rationale", segments);
        AppendJsonStringProperty(element, "whyThisMatters", segments);
        AppendJsonStringProperty(element, "message", segments);
    }

    private static void AppendJsonStringProperty(JsonElement element, string propertyName, List<string> segments)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value)
            || value.ValueKind != JsonValueKind.String)
        {
            return;
        }

        AppendNonEmpty(value.GetString(), segments);
    }

    private static void AppendNonEmpty(string? value, List<string> segments)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        segments.Add(value.Trim());
    }

    private static IEnumerable<string> SplitTokens(string segment)
    {
        return segment
            .Split([' ', '\t', '\r', '\n', ',', ';', ':', '(', ')', '[', ']', '{', '}', '/', '\\', '.'], StringSplitOptions.RemoveEmptyEntries);
    }

    private static void AddToken(HashSet<string> tokens, string? rawToken)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return;
        }

        string token = rawToken.Trim();

        if (token.Length < 3)
        {
            return;
        }

        if (StopWords.Contains(token))
        {
            return;
        }

        tokens.Add(token);
    }
}
