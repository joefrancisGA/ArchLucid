using System.Text.Json;

using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Citation presence and PilotStrict evidence-ref floor checks for
///     <see cref="AgentOutputTraceQualityEvaluator" />.
/// </summary>
internal static class AgentOutputTraceCitationGate
{
    internal static void ApplyCitationOutcome(bool pilotStrict,
        bool hasCitations,
        ref AgentOutputQualityGateOutcome gateOutcome)
    {
        if (hasCitations)
            return;

        if (pilotStrict || gateOutcome == AgentOutputQualityGateOutcome.Rejected)
        {
            gateOutcome = AgentOutputQualityGateOutcome.Rejected;

            return;
        }

        gateOutcome = AgentOutputQualityGateOutcome.Warned;
    }

    internal static bool MeetsEvidenceRefFloor(string parsedResultJson, int minimumCount)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(parsedResultJson);

            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return false;

            return TryCountTopLevelEvidenceRefs(doc.RootElement) >= minimumCount;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    /// <summary>
    ///     True when parsed output has a non-empty top-level <c>citations</c> array.
    ///     Kept <see langword="internal" /> for InternalsVisibleTo callers.
    /// </summary>
    internal static bool TryHasNonEmptyCitations(string parsedResultJson)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(parsedResultJson);

            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return false;

            return doc.RootElement.TryGetProperty("citations", out JsonElement citationsElement)
                   && citationsElement.ValueKind == JsonValueKind.Array
                   && citationsElement.GetArrayLength() > 0;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static int TryCountTopLevelEvidenceRefs(JsonElement root)
    {
        if (!root.TryGetProperty("evidenceRefs", out JsonElement refsElement) ||
            refsElement.ValueKind != JsonValueKind.Array)
            return 0;

        return refsElement.GetArrayLength();
    }
}
