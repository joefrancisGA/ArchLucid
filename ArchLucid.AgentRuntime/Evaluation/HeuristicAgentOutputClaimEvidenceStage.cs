using System.Text.Json;

namespace ArchLucid.AgentRuntime.Evaluation;

internal sealed class HeuristicAgentOutputClaimEvidenceStage
{
    private readonly bool _tightened;

    public HeuristicAgentOutputClaimEvidenceStage(bool tightened) => _tightened = tightened;

    public (double ratio, int emptyCount) Evaluate(JsonElement root)
    {
        if (!TryGetPropertyIgnoreCase(root, "claims", out JsonElement claimsElement) ||
            claimsElement.ValueKind != JsonValueKind.Array)
            return (0.0, 0);

        int total = 0;
        int withEvidence = 0;

        foreach (JsonElement claim in claimsElement.EnumerateArray())
        {
            total++;

            if (claim.ValueKind != JsonValueKind.Object)
                continue;

            bool hasEvidenceRefs = TryGetPropertyIgnoreCase(claim, "evidenceRefs", out JsonElement refs)
                                   && refs.ValueKind == JsonValueKind.Array
                                   && refs.GetArrayLength() > 0;

            int refLen = hasEvidenceRefs ? refs.GetArrayLength() : 0;

            bool hasEvidenceString = TryGetPropertyIgnoreCase(claim, "evidence", out JsonElement ev)
                                     && ev.ValueKind == JsonValueKind.String
                                     && (ev.GetString()?.Length ?? 0) > 0;

            bool backed;

            if (_tightened)

                backed = refLen >= 2 ||
                         (TryGetPropertyIgnoreCase(claim, "evidence", out JsonElement ev2) &&
                          ev2.ValueKind == JsonValueKind.String &&
                          (ev2.GetString()?.Length ?? 0) >= 30);

            else

                backed = hasEvidenceRefs || hasEvidenceString;

            if (backed)

                withEvidence++;
        }

        return total == 0 ? (0.0, 0) : ((double)withEvidence / total, total - withEvidence);
    }

    private static bool TryGetPropertyIgnoreCase(
        JsonElement element,
        string propertyName,
        out JsonElement value)
    {
        if (element.TryGetProperty(propertyName, out value))
            return true;

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }
}
