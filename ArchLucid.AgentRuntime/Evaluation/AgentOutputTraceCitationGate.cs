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

    /// <summary>
    ///     PilotStrict: every non-empty citation <c>source</c> must appear in top-level <c>evidenceRefs</c>.
    /// </summary>
    internal static bool CitationSourcesWithinEvidenceRefs(string parsedResultJson)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(parsedResultJson);

            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return false;

            HashSet<string> evidenceRefs = new(StringComparer.Ordinal);

            if (AgentOutputJsonPropertyReader.TryGetPropertyIgnoreCase(doc.RootElement, "evidenceRefs", out JsonElement refsElement) &&
                refsElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement reference in refsElement.EnumerateArray())
                {
                    if (reference.ValueKind != JsonValueKind.String)
                        continue;

                    string? referenceText = reference.GetString();

                    if (!string.IsNullOrWhiteSpace(referenceText))
                        evidenceRefs.Add(referenceText);
                }
            }

            if (!AgentOutputJsonPropertyReader.TryGetPropertyIgnoreCase(doc.RootElement, "citations", out JsonElement citationsElement) ||
                citationsElement.ValueKind != JsonValueKind.Array)
                return false;

            foreach (JsonElement citation in citationsElement.EnumerateArray())
            {
                if (citation.ValueKind != JsonValueKind.Object)
                    return false;

                if (!AgentOutputJsonPropertyReader.TryGetPropertyIgnoreCase(citation, "source", out JsonElement sourceElement) ||
                    sourceElement.ValueKind != JsonValueKind.String)
                    return false;

                string? source = sourceElement.GetString();

                if (string.IsNullOrWhiteSpace(source) || !evidenceRefs.Contains(source))
                    return false;
            }

            return true;
        }
        catch (JsonException)
        {
            return false;
        }
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

            return AgentOutputJsonPropertyReader.TryGetPropertyIgnoreCase(doc.RootElement, "citations", out JsonElement citationsElement)
                   && citationsElement.ValueKind == JsonValueKind.Array
                   && citationsElement.EnumerateArray().Any(static citation =>
                       citation.ValueKind == JsonValueKind.Object
                       && citation.EnumerateObject().Any(static property =>
                           property.Value.ValueKind == JsonValueKind.String
                           && !string.IsNullOrWhiteSpace(property.Value.GetString())));
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static int TryCountTopLevelEvidenceRefs(JsonElement root)
    {
        if (!AgentOutputJsonPropertyReader.TryGetPropertyIgnoreCase(root, "evidenceRefs", out JsonElement refsElement) ||
            refsElement.ValueKind != JsonValueKind.Array)
            return 0;

        // Count usable references only; null, non-string, and blank entries do not
        // satisfy the PilotStrict evidence contract.
        return refsElement.EnumerateArray()
            .Count(static reference =>
                reference.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(reference.GetString()));
    }
}
