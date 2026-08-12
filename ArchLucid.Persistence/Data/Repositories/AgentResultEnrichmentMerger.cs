using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Data.Repositories;

internal static class AgentResultEnrichmentMerger
{
    internal static IReadOnlyList<AgentResult> Apply(
        IReadOnlyList<AgentResult> baseResults,
        IReadOnlyDictionary<string, AgentResultEnrichmentRecord> enrichmentsByResultId) =>
        Merge(baseResults, enrichmentsByResultId, MergeOne);

    /// <summary>
    ///     Rollup/compare variant (TB-2053): an enriched blob is re-projected so compare stays field-complete without
    ///     retaining reasoning / topology LOBs from the enrichment payload.
    /// </summary>
    internal static IReadOnlyList<AgentResult> ApplyRollup(
        IReadOnlyList<AgentResult> projected,
        IReadOnlyDictionary<string, AgentResultEnrichmentRecord> enrichmentsByResultId) =>
        Merge(projected, enrichmentsByResultId, MergeOneForRollup);

    private static IReadOnlyList<AgentResult> Merge(
        IReadOnlyList<AgentResult> baseResults,
        IReadOnlyDictionary<string, AgentResultEnrichmentRecord> enrichmentsByResultId,
        Func<AgentResult, AgentResultEnrichmentRecord, AgentResult> mergeOne)
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

            merged.Add(mergeOne(baseResult, enrichment));
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

    private static AgentResult MergeOneForRollup(AgentResult baseResult, AgentResultEnrichmentRecord enrichment)
    {
        if (!string.IsNullOrWhiteSpace(enrichment.EnrichedResultJson))
        {
            AgentResult? enriched = DeserializeEnrichedForRollup(
                enrichment.EnrichedResultJson,
                baseResult.ResultId);

            if (enriched is not null)
                return AgentResultRollupProjection.StripHeavyFields(enriched);
        }

        if (enrichment.CalibratedConfidence.HasValue)
            baseResult.CalibratedConfidence = enrichment.CalibratedConfidence;

        return baseResult;
    }

    private static AgentResult Clone(AgentResult source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        AgentResult? copy = JsonSerializer.Deserialize<AgentResult>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null AgentResult.");
    }

    private static AgentResult? DeserializeEnriched(string enrichedResultJson, string resultId) =>
        Deserialize(enrichedResultJson, resultId, ContractJson.Default);

    /// <summary>Rollup reads use the persistence read options so legacy claim shapes still bind.</summary>
    private static AgentResult? DeserializeEnrichedForRollup(string enrichedResultJson, string resultId) =>
        Deserialize(enrichedResultJson, resultId, AgentResultJsonSerialization.DeserializeOptions);

    private static AgentResult? Deserialize(
        string enrichedResultJson,
        string resultId,
        JsonSerializerOptions options)
    {
        try
        {
            return JsonSerializer.Deserialize<AgentResult>(enrichedResultJson, options);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"Enriched AgentResult JSON for '{resultId}' could not be deserialized.", ex);
        }
    }
}
