using System.Text.Json;

using ArchLucid.Core.Retrieval;

namespace ArchLucid.Application.Runs;

/// <summary>Derives Topology exemplar style-prior observability from persisted grounding traces (TB-663).</summary>
public static class TopologyReferenceArchitectureExemplarSummaryResolver
{
    private const string TopologyAgentWireName = "Topology";
    private const string MixedCorpusKind = "Mixed";
    private const string ExemplarDocumentIdPrefix = "exemplar-";
    private const string ChunkIdSuffix = "-chunk-";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static TopologyReferenceArchitectureExemplarSummary Resolve(IReadOnlyList<RetrievalGroundingTraceRecord> traces)
    {
        ArgumentNullException.ThrowIfNull(traces);

        List<RetrievalGroundingTraceRecord> topologyTraces = traces
            .Where(static trace =>
                string.Equals(trace.AgentName, TopologyAgentWireName, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (topologyTraces.Count == 0)
        {
            return new TopologyReferenceArchitectureExemplarSummary
            {
                ExemplarMissing = true,
                ExemplarCount = 0,
                ExemplarDocumentIds = [],
            };
        }

        int exemplarCount = 0;
        HashSet<string> documentIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (RetrievalGroundingTraceRecord trace in topologyTraces)
        {
            if (!TryGetExemplarContribution(trace, out int traceExemplarCount, out IReadOnlyList<string> traceDocumentIds))
                continue;

            exemplarCount += traceExemplarCount;

            foreach (string documentId in traceDocumentIds)
            {
                documentIds.Add(documentId);
            }
        }

        return new TopologyReferenceArchitectureExemplarSummary
        {
            ExemplarMissing = exemplarCount == 0,
            ExemplarCount = exemplarCount,
            ExemplarDocumentIds = documentIds
                .OrderBy(static id => id, StringComparer.OrdinalIgnoreCase)
                .ToList(),
        };
    }

    private static bool TryGetExemplarContribution(
        RetrievalGroundingTraceRecord trace,
        out int exemplarChunkCount,
        out IReadOnlyList<string> exemplarDocumentIds)
    {
        exemplarChunkCount = 0;
        exemplarDocumentIds = [];

        if (string.IsNullOrWhiteSpace(trace.CorpusKind))
        {
            if (trace.RetrievedChunkIds.Count > 0)
                return false;

            return true;
        }

        if (string.Equals(trace.CorpusKind, CorpusKind.ReferenceArchitecture.ToString(), StringComparison.OrdinalIgnoreCase))
        {
            exemplarDocumentIds = ParseDocumentIds(trace.DocumentIdsJson).ToList();
            exemplarChunkCount = trace.RetrievedChunkIds.Count;
            return exemplarChunkCount > 0 || exemplarDocumentIds.Count > 0;
        }

        if (!string.Equals(trace.CorpusKind, MixedCorpusKind, StringComparison.OrdinalIgnoreCase))
            return false;

        List<string> mixedExemplarDocumentIds = ParseDocumentIds(trace.DocumentIdsJson)
            .Where(IsExemplarDocumentId)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (mixedExemplarDocumentIds.Count == 0)
            return false;

        exemplarDocumentIds = mixedExemplarDocumentIds;
        exemplarChunkCount = CountExemplarChunks(trace.RetrievedChunkIds, mixedExemplarDocumentIds);

        if (exemplarChunkCount == 0)
            exemplarChunkCount = mixedExemplarDocumentIds.Count;

        return true;
    }

    private static int CountExemplarChunks(
        IReadOnlyList<string> retrievedChunkIds,
        IReadOnlyList<string> exemplarDocumentIds)
    {
        if (retrievedChunkIds.Count == 0 || exemplarDocumentIds.Count == 0)
            return 0;

        int count = 0;

        foreach (string chunkId in retrievedChunkIds)
        {
            if (string.IsNullOrWhiteSpace(chunkId))
                continue;

            foreach (string documentId in exemplarDocumentIds)
            {
                if (chunkId.StartsWith(documentId + ChunkIdSuffix, StringComparison.OrdinalIgnoreCase))
                {
                    count++;
                    break;
                }
            }
        }

        return count;
    }

    private static bool IsExemplarDocumentId(string documentId) =>
        documentId.StartsWith(ExemplarDocumentIdPrefix, StringComparison.OrdinalIgnoreCase);

    private static IEnumerable<string> ParseDocumentIds(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            yield break;

        List<string>? documentIds;

        try
        {
            documentIds = JsonSerializer.Deserialize<List<string>>(json, JsonOptions);
        }
        catch (JsonException)
        {
            yield break;
        }

        if (documentIds is null)
            yield break;

        foreach (string documentId in documentIds)
        {
            if (!string.IsNullOrWhiteSpace(documentId))
                yield return documentId.Trim();
        }
    }
}
