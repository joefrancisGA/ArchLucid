using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Llm;

namespace ArchLucid.Application.Planning;

/// <summary>
///     LLM judge that flags confirmed assumptions contradicted by explicit overview evidence.
///     When unsure, returns no contradictions.
/// </summary>
public sealed class BriefAssumptionEvidenceContradictionPass(
    IAgentCompletionClient completionClient) : IBriefAssumptionEvidenceContradictionPass
{
    private const string ContradictionSystemPrompt =
        "You are an enterprise architecture intake reviewer. " +
        "Given an architecture overview (evidence text) and confirmed assumptions the operator stated, " +
        "identify assumptions that are contradicted by explicit evidence in the overview. " +
        "Return ONLY valid JSON with key contradictions (array). " +
        "Each object must have: assumption (string, exact text from the input list), " +
        "evidenceNote (string, one short sentence describing what in the overview contradicts it). " +
        "Flag only clear contradictions — not absence of support, soft tension, or compatible related facts. " +
        "When unsure, do not flag. If none are contradicted, return contradictions: [].";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IAgentCompletionClient _completionClient = completionClient
                                                                  ?? throw new ArgumentNullException(nameof(completionClient));

    public async Task<IReadOnlyList<EvidenceContradictedBriefAssumption>> DetectAsync(
        string overviewText,
        IReadOnlyList<string> confirmedAssumptions,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(overviewText);
        ArgumentNullException.ThrowIfNull(confirmedAssumptions);

        string[] normalizedAssumptions = NormalizeConfirmedAssumptions(confirmedAssumptions);

        if (normalizedAssumptions.Length == 0 || string.IsNullOrWhiteSpace(overviewText))
            return [];

        try
        {
            string userPrompt = BuildUserPrompt(overviewText, normalizedAssumptions);

            string responseJson = await _completionClient.CompleteJsonAsync(
                ContradictionSystemPrompt,
                userPrompt,
                maxTokens: 600,
                temperature: 0.1f,
                cancellationToken: cancellationToken);

            ContradictionResponseShape? response =
                JsonSerializer.Deserialize<ContradictionResponseShape>(responseJson, JsonOptions);

            if (response?.Contradictions is null || response.Contradictions.Count == 0)
                return [];

            return MapContradictions(normalizedAssumptions, response.Contradictions);
        }
        catch (Exception)
        {
            return [];
        }
    }

    internal static string[] NormalizeConfirmedAssumptions(IReadOnlyList<string> confirmedAssumptions)
    {
        if (confirmedAssumptions.Count == 0)
            return [];

        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        List<string> normalized = [];

        foreach (string assumption in confirmedAssumptions)
        {
            if (!ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry(assumption))
                continue;

            string trimmed = assumption.Trim();

            if (!seen.Add(trimmed))
                continue;

            normalized.Add(trimmed);
        }

        return normalized.ToArray();
    }

    internal static string BuildUserPrompt(string overviewText, IReadOnlyList<string> confirmedAssumptions)
    {
        StringBuilder builder = new();
        builder.AppendLine("Architecture overview (evidence):");
        builder.AppendLine(overviewText.Trim());
        builder.AppendLine();
        builder.AppendLine("Confirmed assumptions (check each for contradiction):");
        AppendNumberedItems(builder, confirmedAssumptions);

        return builder.ToString();
    }

    internal static List<EvidenceContradictedBriefAssumption> MapContradictions(
        IReadOnlyList<string> confirmedAssumptions,
        IReadOnlyList<ContradictionShape> contradictions)
    {
        Dictionary<string, string> assumptionByKey = new(StringComparer.OrdinalIgnoreCase);

        foreach (string assumption in confirmedAssumptions)
            assumptionByKey.TryAdd(assumption, assumption);

        List<EvidenceContradictedBriefAssumption> mapped = [];
        HashSet<string> emitted = new(StringComparer.OrdinalIgnoreCase);

        foreach (ContradictionShape contradiction in contradictions)
        {
            if (string.IsNullOrWhiteSpace(contradiction.Assumption))
                continue;

            string assumptionKey = contradiction.Assumption.Trim();

            if (!assumptionByKey.TryGetValue(assumptionKey, out string? canonicalAssumption))
                continue;

            if (!emitted.Add(canonicalAssumption))
                continue;

            string evidenceNote = contradiction.EvidenceNote?.Trim() ?? string.Empty;

            mapped.Add(new EvidenceContradictedBriefAssumption
            {
                Assumption = canonicalAssumption,
                EvidenceNote = evidenceNote,
            });
        }

        return mapped;
    }

    private static void AppendNumberedItems(StringBuilder builder, IReadOnlyList<string> items)
    {
        for (int index = 0; index < items.Count; index++)
            builder.AppendLine($"{index + 1}. {items[index]}");
    }

    private sealed class ContradictionResponseShape
    {
        [JsonPropertyName("contradictions")]
        public List<ContradictionShape>? Contradictions
        {
            get;
            init;
        }
    }

    internal sealed class ContradictionShape
    {
        [JsonPropertyName("assumption")]
        public string? Assumption
        {
            get;
            init;
        }

        [JsonPropertyName("evidenceNote")]
        public string? EvidenceNote
        {
            get;
            init;
        }
    }
}
