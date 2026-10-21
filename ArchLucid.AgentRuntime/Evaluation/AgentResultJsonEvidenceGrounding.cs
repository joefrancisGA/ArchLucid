using System.Text.Json;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>JSON extraction shared by token-overlap and embedding faithfulness heuristics.</summary>
internal static class AgentResultJsonEvidenceGrounding
{
    internal static bool TryDescribeClaim(JsonElement claim, out string claimText, out List<string> refs)
    {
        claimText = string.Empty;
        refs = [];

        switch (claim.ValueKind)
        {
            case JsonValueKind.String:
                claimText = claim.GetString() ?? string.Empty;

                return !string.IsNullOrWhiteSpace(claimText);

            case JsonValueKind.Object:

                foreach (string prop in new[] { "detail", "text", "evidence", "statement", "claim" })
                {
                    if (!AgentOutputJsonPropertyReader.TryGetPropertyIgnoreCase(claim, prop, out JsonElement p)
                        || p.ValueKind != JsonValueKind.String)
                        continue;

                    string? s = p.GetString();

                    if (!string.IsNullOrWhiteSpace(s))
                        claimText = string.IsNullOrEmpty(claimText) ? s : $"{claimText} {s}";
                }

                if (!TryReadEvidenceRefs(claim, out refs))
                    return false;

                return !string.IsNullOrWhiteSpace(claimText) || refs.Count > 0;

            default:
                return false;
        }
    }

    internal static bool TryGetFindingTextParts(
        JsonElement finding,
        out string category,
        out string description,
        out string recommendation) =>
        TryGetFindingTextParts(finding, out category, out description, out recommendation, out _);

    internal static bool TryGetFindingTextParts(
        JsonElement finding,
        out string category,
        out string description,
        out string recommendation,
        out List<string> evidenceRefs)
    {
        category = string.Empty;
        description = string.Empty;
        recommendation = string.Empty;
        evidenceRefs = [];

        if (finding.ValueKind != JsonValueKind.Object)
            return false;

        category =
            AgentOutputJsonPropertyReader.TryGetPropertyIgnoreCase(finding, "category", out JsonElement cat) && cat.ValueKind == JsonValueKind.String
                ? cat.GetString() ?? string.Empty
                : string.Empty;

        // Topology, critic, and compliance prompts emit message. Older fixtures use description.
        description = FirstNonEmptyString(finding, MessagePropertyNames);

        recommendation =
            AgentOutputJsonPropertyReader.TryGetPropertyIgnoreCase(finding, "recommendation", out JsonElement r) && r.ValueKind == JsonValueKind.String
                ? r.GetString() ?? string.Empty
                : string.Empty;

        return TryReadEvidenceRefs(finding, out evidenceRefs);
    }

    // Same aliases ArchitectureFindingJsonConverter maps onto Message.
    private static readonly string[] MessagePropertyNames = ["message", "description", "title", "detail"];

    private static string FirstNonEmptyString(JsonElement owner, IReadOnlyList<string> propertyNames)
    {
        foreach (string propertyName in propertyNames)
        {
            if (!AgentOutputJsonPropertyReader.TryGetPropertyIgnoreCase(owner, propertyName, out JsonElement property) ||
                property.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            string? text = property.GetString();

            if (!string.IsNullOrWhiteSpace(text))
                return text;
        }

        return string.Empty;
    }

    private static bool TryReadEvidenceRefs(JsonElement owner, out List<string> refs)
    {
        refs = [];

        if (!AgentOutputJsonPropertyReader.TryGetPropertyIgnoreCase(owner, "evidenceRefs", out JsonElement evidenceRefs))
            return true;

        if (evidenceRefs.ValueKind != JsonValueKind.Array)
            return false;

        foreach (JsonElement id in evidenceRefs.EnumerateArray())
        {
            if (id.ValueKind != JsonValueKind.String)
            {
                refs.Add(string.Empty);

                continue;
            }

            string? value = id.GetString();

            refs.Add(string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim());
        }

        return true;
    }
}
