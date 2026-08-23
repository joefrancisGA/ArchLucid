using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Llm;

namespace ArchLucid.Application.Planning;

/// <summary>
///     Second-pass LLM judge that drops semantically duplicate constraint or assumption suggestions.
///     Exact-match dedupe runs first; when unsure, candidates are kept.
/// </summary>
public sealed class ArchitectureRequestDraftSemanticUniquePass(
    IAgentCompletionClient completionClient) : IArchitectureRequestDraftSemanticUniquePass
{
    private const string SemanticUniqueSystemPrompt =
        "You are an enterprise architecture intake reviewer. " +
        "Given anchor items already on a draft and a ordered list of new candidate suggestions, " +
        "decide for each candidate whether to keep or drop it. " +
        "Return ONLY valid JSON with key decisions (array). " +
        "Each decision object must have: candidate (string, exact text from input), " +
        "decision (\"keep\" or \"drop\"), duplicateOf (string or null — the anchor or earlier kept candidate it duplicates). " +
        "Rules: " +
        "Drop only when a reviewer would treat the candidate as the same fact or obligation as an anchor item or an earlier candidate you are keeping. " +
        "Related-but-distinct items MUST be kept (examples: encryption at rest vs encryption in transit; " +
        "99.9% uptime vs 10k concurrent users; data residency vs SOC 2; React frontend vs Java backend). " +
        "Paraphrases of the same obligation are duplicates (examples: \"Support for mobile and web\" vs \"Mobile and web support\"; " +
        "\"All user data must be encrypted\" vs \"Stored data must be encrypted\" when both mean data-at-rest encryption). " +
        "Process candidates in order — first-wins within the batch. " +
        "When unsure, keep.";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                  ?? throw new ArgumentNullException(nameof(completionClient));

    public async Task<string[]> FilterDuplicatesAsync(
        ArchitectureRequestDraftListKind listKind,
        IReadOnlyList<string> existingItems,
        IReadOnlyList<string> candidates,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(existingItems);
        ArgumentNullException.ThrowIfNull(candidates);

        string[] normalizedExisting = NormalizeExact(existingItems);
        List<string> exactUniqueCandidates = FilterExactDuplicates(normalizedExisting, candidates);

        if (exactUniqueCandidates.Count == 0)
            return [];

        if (exactUniqueCandidates.Count == 1 && normalizedExisting.Length == 0)
            return [exactUniqueCandidates[0]];

        try
        {
            string userPrompt = BuildUserPrompt(listKind, normalizedExisting, exactUniqueCandidates);

            string responseJson = await _completionClient.CompleteJsonAsync(
                SemanticUniqueSystemPrompt,
                userPrompt,
                maxTokens: 800,
                temperature: 0.1f,
                cancellationToken: cancellationToken);

            SemanticUniqueResponseShape? response =
                JsonSerializer.Deserialize<SemanticUniqueResponseShape>(responseJson, JsonOptions);

            if (response?.Decisions is null || response.Decisions.Count == 0)
                return exactUniqueCandidates.ToArray();

            return ApplyDecisions(exactUniqueCandidates, response.Decisions);
        }
        catch (Exception)
        {
            return exactUniqueCandidates.ToArray();
        }
    }

    internal static string[] NormalizeExact(IReadOnlyList<string> values)
    {
        if (values.Count == 0)
            return [];

        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        List<string> normalized = [];

        foreach (string value in values)
        {
            if (string.IsNullOrWhiteSpace(value))
                continue;

            string trimmed = value.Trim();

            if (!seen.Add(trimmed))
                continue;

            normalized.Add(trimmed);
        }

        return normalized.ToArray();
    }

    internal static List<string> FilterExactDuplicates(
        IReadOnlyList<string> existingItems,
        IReadOnlyList<string> candidates)
    {
        HashSet<string> seen = new(existingItems, StringComparer.OrdinalIgnoreCase);
        List<string> kept = [];

        foreach (string candidate in candidates)
        {
            if (string.IsNullOrWhiteSpace(candidate))
                continue;

            string trimmed = candidate.Trim();

            if (!seen.Add(trimmed))
                continue;

            kept.Add(trimmed);
        }

        return kept;
    }

    internal static string BuildUserPrompt(
        ArchitectureRequestDraftListKind listKind,
        IReadOnlyList<string> existingItems,
        IReadOnlyList<string> candidates)
    {
        string listLabel = listKind switch
        {
            ArchitectureRequestDraftListKind.Constraints => "constraints",
            ArchitectureRequestDraftListKind.Assumptions => "assumptions",
            _ => throw new ArgumentOutOfRangeException(nameof(listKind), listKind, "Unknown list kind."),
        };

        StringBuilder builder = new();
        builder.AppendLine($"List kind: {listLabel}");
        builder.AppendLine();
        builder.AppendLine("Anchor items already on the draft (always win over candidates):");
        AppendNumberedItems(builder, existingItems);
        builder.AppendLine();
        builder.AppendLine("New candidates (in order — keep first instance, drop later semantic duplicates):");
        AppendNumberedItems(builder, candidates);

        return builder.ToString();
    }

    internal static string[] ApplyDecisions(
        IReadOnlyList<string> candidates,
        IReadOnlyList<SemanticUniqueDecisionShape> decisions)
    {
        Dictionary<string, SemanticUniqueDecisionShape> decisionByCandidate = new(StringComparer.Ordinal);

        foreach (SemanticUniqueDecisionShape decision in decisions)
        {
            if (string.IsNullOrWhiteSpace(decision.Candidate))
                continue;

            decisionByCandidate.TryAdd(decision.Candidate.Trim(), decision);
        }

        List<string> kept = [];

        foreach (string candidate in candidates)
        {
            if (!decisionByCandidate.TryGetValue(candidate, out SemanticUniqueDecisionShape? decision))
            {
                kept.Add(candidate);
                continue;
            }

            if (IsKeepDecision(decision.Decision))
                kept.Add(candidate);
        }

        return kept.ToArray();
    }

    private static void AppendNumberedItems(StringBuilder builder, IReadOnlyList<string> items)
    {
        if (items.Count == 0)
        {
            builder.AppendLine("(none)");
            return;
        }

        for (int index = 0; index < items.Count; index++)
            builder.AppendLine($"{index + 1}. {items[index]}");
    }

    private static bool IsKeepDecision(string? decision)
    {
        if (string.IsNullOrWhiteSpace(decision))
            return true;

        return !string.Equals(decision.Trim(), "drop", StringComparison.OrdinalIgnoreCase);
    }

    private sealed class SemanticUniqueResponseShape
    {
        [JsonPropertyName("decisions")]
        public List<SemanticUniqueDecisionShape>? Decisions
        {
            get;
            init;
        }
    }

    internal sealed class SemanticUniqueDecisionShape
    {
        [JsonPropertyName("candidate")]
        public string? Candidate
        {
            get;
            init;
        }

        [JsonPropertyName("decision")]
        public string? Decision
        {
            get;
            init;
        }

        [JsonPropertyName("duplicateOf")]
        public string? DuplicateOf
        {
            get;
            init;
        }
    }
}
