using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Ask;

internal static class InfraEvidenceAskPromptBuilder
{
    public const string SimulatorLabel =
        "SIMULATOR — deterministic template grounded on cited structured rows only.";

    private const string SystemPrompt =
        "You are an enterprise cloud architect answering questions from structured infrastructure-evidence rows. "
        + "Use ONLY the provided evidence lines. Do not invent Azure resource ids, change ids, or finding ids. "
        + "Return ONLY JSON: {\"answer\":\"...\",\"citationIds\":[\"kind:id\",...]} "
        + "where citationIds must be chosen from the allowedCitationIds list.";

    public static string BuildSystemPrompt() => SystemPrompt;

    public static string BuildUserPrompt(string question, string topicKind, InfraEvidenceAskEvidenceBundle bundle)
    {
        StringBuilder builder = new();
        builder.AppendLine($"topicKind={topicKind}");
        builder.AppendLine($"question={question.Trim()}");
        builder.AppendLine("allowedCitationIds:");

        foreach (InfraEvidenceAskCitation citation in bundle.Citations)
            builder.AppendLine($"  {FormatCitationKey(citation)}");

        builder.AppendLine("evidenceRows:");

        foreach (string line in bundle.EvidenceLines)
            builder.AppendLine($"  {line}");

        return builder.ToString();
    }

    public static string BuildSimulatorAnswer(string question, InfraEvidenceAskEvidenceBundle bundle)
    {
        if (bundle.Citations.Count == 0)
            return "Insufficient structured evidence is available to answer this question.";

        string cited = string.Join(", ", bundle.Citations.Take(5).Select(FormatCitationKey));
        return $"Based on {bundle.Citations.Count} structured evidence row(s), the answer to \"{question.Trim()}\" "
            + $"is grounded on: {cited}. No ARM resources were invented beyond cited rows.";
    }

    public static IReadOnlyList<InfraEvidenceAskCitation> SelectSimulatorCitations(InfraEvidenceAskEvidenceBundle bundle)
        => bundle.Citations.Take(5).ToList();

    public static bool TryParseLlmResponse(
        string llmJson,
        InfraEvidenceAskEvidenceBundle bundle,
        out string answer,
        out IReadOnlyList<InfraEvidenceAskCitation> citations)
    {
        answer = string.Empty;
        citations = [];

        try
        {
            InfraEvidenceAskLlmResponse? parsed =
                JsonSerializer.Deserialize<InfraEvidenceAskLlmResponse>(llmJson, JsonOptions);

            if (parsed is null || string.IsNullOrWhiteSpace(parsed.Answer))
                return false;

            answer = parsed.Answer.Trim();
            HashSet<string> allowed = bundle.Citations.Select(FormatCitationKey).ToHashSet(StringComparer.OrdinalIgnoreCase);
            List<InfraEvidenceAskCitation> selected = [];

            foreach (string citationId in parsed.CitationIds)
            {
                if (!allowed.Contains(citationId))
                    continue;

                InfraEvidenceAskCitation? match = bundle.Citations.FirstOrDefault(
                    citation => string.Equals(FormatCitationKey(citation), citationId, StringComparison.OrdinalIgnoreCase));

                if (match is not null)
                    selected.Add(match);
            }

            citations = selected;
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    public static string FormatCitationKey(InfraEvidenceAskCitation citation)
        => $"{citation.Kind}:{citation.Id}";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private sealed class InfraEvidenceAskLlmResponse
    {
        public string Answer
        {
            get;
            set;
        } = string.Empty;

        public List<string> CitationIds
        {
            get;
            set;
        } = [];
    }
}
