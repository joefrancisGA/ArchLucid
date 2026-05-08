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
                    if (!claim.TryGetProperty(prop, out JsonElement p) || p.ValueKind != JsonValueKind.String)

                        continue;

                    string? s = p.GetString();

                    if (!string.IsNullOrWhiteSpace(s))
                        claimText = string.IsNullOrEmpty(claimText) ? s! : $"{claimText} {s}";
                }

                if (claim.TryGetProperty("evidenceRefs", out JsonElement r) && r.ValueKind == JsonValueKind.Array)
                {
                    foreach (JsonElement id in r.EnumerateArray())
                    {
                        if (id.ValueKind == JsonValueKind.String)
                        {
                            string? s = id.GetString();

                            if (!string.IsNullOrWhiteSpace(s))
                                refs.Add(s.Trim());
                        }
                    }
                }

                return !string.IsNullOrWhiteSpace(claimText) || refs.Count > 0;

            default:
                return false;
        }
    }

    internal static bool TryGetFindingTextParts(
        JsonElement finding,
        out string category,
        out string description,
        out string recommendation)
    {
        category = string.Empty;
        description = string.Empty;
        recommendation = string.Empty;

        if (finding.ValueKind != JsonValueKind.Object)
            return false;

        category =
            finding.TryGetProperty("category", out JsonElement cat) && cat.ValueKind == JsonValueKind.String
                ? cat.GetString() ?? string.Empty
                : string.Empty;

        description =
            finding.TryGetProperty("description", out JsonElement d) && d.ValueKind == JsonValueKind.String
                ? d.GetString() ?? string.Empty
                : string.Empty;

        recommendation =
            finding.TryGetProperty("recommendation", out JsonElement r) && r.ValueKind == JsonValueKind.String
                ? r.GetString() ?? string.Empty
                : string.Empty;

        return true;
    }
}
