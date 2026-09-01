using System.Text.Json;

using ArchLucid.Core.Explanation;
using ArchLucid.Provenance;

using JetBrains.Annotations;

namespace ArchLucid.AgentRuntime.Explanation;

public sealed partial class DeterministicExplanationService
{
    /// <inheritdoc />
    public ExplanationResult BuildRunExplanationFromLlmPayload(
        ManifestDocument manifest,
        List<string> keyDrivers,
        List<string> risks,
        List<string> costs,
        List<string> compliance,
        string rawStored)
    {
        string heuristicSummary = HeuristicRunSummary(manifest);
        string narrativeFallback = BuildRunNarrativeFallback(manifest, keyDrivers, risks);

        ExplanationResult result = new()
        {
            RawText = rawStored,
            KeyDrivers = keyDrivers,
            RiskImplications = risks,
            CostImplications = costs,
            ComplianceImplications = compliance
        };

        if (StructuredExplanationParser.TryNormalizeStructuredJson(rawStored, out StructuredExplanation? structured))
        {
            result.Structured = structured;
            result.DetailedNarrative = structured.Reasoning.Trim();
            result.Summary = SummarizeFromReasoning(structured.Reasoning, heuristicSummary);

            return result;
        }

        LlmRunJsonDto? legacy = TryDeserialize<LlmRunJsonDto>(rawStored);

        if (legacy is not null
            && (!string.IsNullOrWhiteSpace(legacy.Summary) || !string.IsNullOrWhiteSpace(legacy.DetailedNarrative)))
        {
            string summary = !string.IsNullOrWhiteSpace(legacy.Summary)
                ? legacy.Summary.Trim()
                : heuristicSummary;
            string narrative = !string.IsNullOrWhiteSpace(legacy.DetailedNarrative)
                ? legacy.DetailedNarrative.Trim()
                : !string.IsNullOrWhiteSpace(legacy.Summary)
                    ? legacy.Summary.Trim()
                    : narrativeFallback;

            result.Summary = summary;
            result.DetailedNarrative = narrative;
            result.Structured = new StructuredExplanation
            {
                Reasoning = narrative, SchemaVersion = 1, EvidenceRefs = []
            };

            return result;
        }

        if (!string.IsNullOrWhiteSpace(rawStored))
        {
            if (IsProbablyJsonObject(rawStored))
            {
                result.Summary = heuristicSummary;
                result.DetailedNarrative = narrativeFallback;
                result.Structured = new StructuredExplanation
                {
                    Reasoning = narrativeFallback, SchemaVersion = 1, EvidenceRefs = []
                };

                return result;
            }

            StructuredExplanation envelope = StructuredExplanationParser.Parse(rawStored);
            result.Structured = envelope;
            result.DetailedNarrative = string.IsNullOrWhiteSpace(envelope.Reasoning)
                ? narrativeFallback
                : envelope.Reasoning.Trim();
            result.Summary = SummarizeFromReasoning(result.DetailedNarrative, heuristicSummary);

            return result;
        }

        result.Summary = heuristicSummary;
        result.DetailedNarrative = narrativeFallback;
        result.Structured = new StructuredExplanation
        {
            Reasoning = narrativeFallback, SchemaVersion = 1, EvidenceRefs = []
        };

        return result;
    }

    private static bool IsProbablyJsonObject(string raw)
    {
        try
        {
            using JsonDocument doc = JsonDocument.Parse(raw);

            return doc.RootElement.ValueKind == JsonValueKind.Object;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static string HeuristicRunSummary(ManifestDocument manifest)
    {
        return string.IsNullOrWhiteSpace(manifest.Metadata.Summary)
            ? $"Run {manifest.RunId} manifest ({manifest.Decisions.Count} decisions, {manifest.UnresolvedIssues.Items.Count} open issues)."
            : manifest.Metadata.Summary.Trim();
    }

    private static string SummarizeFromReasoning(string reasoning, string heuristicSummary)
    {
        string r = reasoning.Trim();

        if (r.Length == 0)
            return heuristicSummary;

        int idx = r.IndexOf("\n\n", StringComparison.Ordinal);

        string first = idx > 0 ? r[..idx] : r;

        const int maxLen = 500;

        if (first.Length > maxLen)
            return first[..maxLen].TrimEnd() + "…";

        return first;
    }

    private static string BuildRunNarrativeFallback(
        ManifestDocument m,
        List<string> drivers,
        List<string> risks)
    {
        return string.Join("\n\n",
            new[]
            {
                $"This run ({m.RunId}) reflects {m.Decisions.Count} recorded architecture decision(s).",
                "Key drivers:\n" + string.Join("\n", drivers.Take(12).Select(x => "- " + x)),
                "Risk / issue context:\n" + string.Join("\n", risks.Take(8).Select(x => "- " + x))
            }.Where(x => !string.IsNullOrWhiteSpace(x)));
    }

    [UsedImplicitly]
    private sealed class LlmRunJsonDto
    {
        [UsedImplicitly]
        public string? Summary
        {
            get;
            set;
        }

        [UsedImplicitly]
        public string? DetailedNarrative
        {
            get;
            set;
        }
    }
}
