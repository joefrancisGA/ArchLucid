using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Embedding;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <inheritdoc cref="ArchLucid.Contracts.Agents.IAgentResultEmbeddingFaithfulnessScorer" />
public sealed class AgentResultEmbeddingFaithfulnessScorer(
    IEmbeddingService embeddingService,
    ITextChunker textChunker,
    IOptionsMonitor<AgentFaithfulnessOptions> faithfulnessOptions,
    ILogger<AgentResultEmbeddingFaithfulnessScorer> logger) : IAgentResultEmbeddingFaithfulnessScorer
{
    private readonly IEmbeddingService _embeddingService =
        embeddingService ?? throw new ArgumentNullException(nameof(embeddingService));

    private readonly ITextChunker _textChunker =
        textChunker ?? throw new ArgumentNullException(nameof(textChunker));

    private readonly IOptionsMonitor<AgentFaithfulnessOptions> _faithfulnessOptions =
        faithfulnessOptions ?? throw new ArgumentNullException(nameof(faithfulnessOptions));

    private readonly ILogger<AgentResultEmbeddingFaithfulnessScorer> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<double?> TryComputeMeanCosineAsync(
        string parsedResultJson,
        AgentEvidencePackage evidencePackage,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(evidencePackage);

        AgentFaithfulnessOptions opts = _faithfulnessOptions.CurrentValue;

        if (!opts.EmbeddingEnabled)
            return null;

        if (string.IsNullOrWhiteSpace(parsedResultJson))
            return null;

        AgentEvidenceGroundingIndex.Index index = AgentEvidenceGroundingIndex.Build(evidencePackage);
        string fullBlob = index.FullBlob;

        if (string.IsNullOrWhiteSpace(fullBlob))
            return null;

        int maxChars = Math.Clamp(opts.EmbeddingMaxChunkUtf16Length, 128, 8192);
        int overlap = Math.Clamp(opts.EmbeddingChunkOverlapUtf16, 0, maxChars - 1);

        List<(string Hypothesis, string EvidenceBlob)> hypotheses = [];

        try
        {
            using JsonDocument doc = JsonDocument.Parse(parsedResultJson);

            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return null;

            if (doc.RootElement.TryGetProperty("claims", out JsonElement claimsEl) &&
                claimsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement claim in claimsEl.EnumerateArray())
                {
                    if (!AgentResultJsonEvidenceGrounding.TryDescribeClaim(claim, out string claimText, out List<string> refs))
                        continue;

                    string citedBlob = index.ResolveRefsBlob(refs);

                    if (refs.Count > 0 && string.IsNullOrEmpty(citedBlob))
                        continue;

                    string blobForEvidence = string.IsNullOrEmpty(citedBlob) ? fullBlob : citedBlob;

                    if (string.IsNullOrWhiteSpace(blobForEvidence))
                        continue;

                    if (string.IsNullOrWhiteSpace(claimText))
                        continue;

                    hypotheses.Add((claimText.Trim(), blobForEvidence));
                }
            }

            if (doc.RootElement.TryGetProperty("findings", out JsonElement findingsEl) &&
                findingsEl.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement finding in findingsEl.EnumerateArray())
                {
                    if (!AgentResultJsonEvidenceGrounding.TryGetFindingTextParts(
                            finding,
                            out _,
                            out string description,
                            out string recommendation))
                        continue;

                    string hypothesis = $"{description} {recommendation}".Trim();

                    if (string.IsNullOrWhiteSpace(hypothesis))
                        continue;

                    hypotheses.Add((hypothesis, fullBlob));
                }
            }
        }
        catch (JsonException ex)
        {
            _logger.LogDebug(ex, "Embedding faithfulness skipped: AgentResult JSON parse failed.");

            return null;
        }

        if (hypotheses.Count == 0)
            return null;

        HashSet<string> uniqueChunks = new(StringComparer.Ordinal);

        foreach ((string hypothesis, string evidenceBlob) in hypotheses)
        {
            foreach (string chunk in _textChunker.Chunk(hypothesis, maxChars, overlap))
                _ = uniqueChunks.Add(chunk);

            foreach (string chunk in _textChunker.Chunk(evidenceBlob, maxChars, overlap))
                _ = uniqueChunks.Add(chunk);
        }

        List<string> orderedChunks = uniqueChunks.ToList();

        if (orderedChunks.Count == 0)
            return null;

        Dictionary<string, float[]> vectorByChunk;

        try
        {
            IReadOnlyList<float[]> embedded =
                await _embeddingService.EmbedManyAsync(orderedChunks, cancellationToken).ConfigureAwait(false);

            if (embedded.Count != orderedChunks.Count)
            {
                _logger.LogWarning(
                    "Embedding faithfulness skipped: embed batch size mismatch ({Expected} vs {Actual}).",
                    orderedChunks.Count,
                    embedded.Count);

                return null;
            }

            vectorByChunk = new Dictionary<string, float[]>(StringComparer.Ordinal);

            for (int i = 0; i < orderedChunks.Count; i++)
                vectorByChunk[orderedChunks[i]] = embedded[i];
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Embedding faithfulness skipped after embed failure.");

            return null;
        }

        List<double> hypothesisMeans = [];

        foreach ((string hypothesis, string evidenceBlob) in hypotheses)
        {
            IReadOnlyList<string> hypChunks = _textChunker.Chunk(hypothesis, maxChars, overlap);
            IReadOnlyList<string> evChunks = _textChunker.Chunk(evidenceBlob, maxChars, overlap);

            if (hypChunks.Count == 0 || evChunks.Count == 0)
                continue;

            double chunkAccum = hypChunks.Select(hc => vectorByChunk[hc]).Select(hv => evChunks.Select(ec => vectorByChunk[ec]).Select(ev => EmbeddingFaithfulnessVectorMath.CosineSimilarity(hv, ev)).Prepend(double.NegativeInfinity).Max()).Sum();

            hypothesisMeans.Add(chunkAccum / hypChunks.Count);
        }

        if (hypothesisMeans.Count == 0)
            return null;

        double mean = hypothesisMeans.Average();

        return Math.Clamp(mean, -1.0, 1.0);
    }
}
