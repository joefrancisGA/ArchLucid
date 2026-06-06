using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;

namespace ArchLucid.Persistence.Data.Repositories;

internal static class AgentResultEnrichmentMerger
{
    internal static IReadOnlyList<AgentResult> Apply(
        IReadOnlyList<AgentResult> baseResults,
        IReadOnlyDictionary<string, AgentResultEnrichmentRecord> enrichmentsByResultId)
    {
        if (enrichmentsByResultId.Count == 0)
            return baseResults;

        List<AgentResult> merged = [];

        foreach (AgentResult baseResult in baseResults)
        {
            if (!enrichmentsByResultId.TryGetValue(baseResult.ResultId, out AgentResultEnrichmentRecord? enrichment))
            {
                merged.Add(baseResult);
                continue;
            }

            merged.Add(MergeOne(baseResult, enrichment));
        }

        return merged;
    }

    private static AgentResult MergeOne(AgentResult baseResult, AgentResultEnrichmentRecord enrichment)
    {
        AgentResult merged = Clone(baseResult);

        if (enrichment.CalibratedConfidence.HasValue)
            merged.CalibratedConfidence = enrichment.CalibratedConfidence;

        if (!string.IsNullOrWhiteSpace(enrichment.EnrichedResultJson))
        {
            AgentResult? enriched = DeserializeEnriched(enrichment.EnrichedResultJson, baseResult.ResultId);

            if (enriched is not null)
                merged = enriched;
        }

        return merged;
    }

    private static AgentResult Clone(AgentResult source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        AgentResult? copy = JsonSerializer.Deserialize<AgentResult>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null AgentResult.");
    }

    private static AgentResult? DeserializeEnriched(string enrichedResultJson, string resultId)
    {
        try
        {
            return JsonSerializer.Deserialize<AgentResult>(enrichedResultJson, ContractJson.Default);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Enriched AgentResult JSON for '{resultId}' could not be deserialized.", ex);
        }
    }
}
