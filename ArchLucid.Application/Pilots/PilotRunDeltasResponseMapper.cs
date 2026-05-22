using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Application.Pilots;

/// <summary>Maps <see cref="PilotRunDeltas"/> to the HTTP JSON contract <see cref="PilotRunDeltasResponse"/>.</summary>
public static class PilotRunDeltasResponseMapper
{
    public static PilotRunDeltasResponse ToResponse(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        return MapCore(deltas, null, proofPackage: null);
    }

    /// <summary>
    ///     Includes <see cref="PilotRunDeltasResponse.ProofPackageCompleteness"/> for operators hitting
    ///     <c>GET /v1/pilots/runs/{runId}/pilot-run-deltas</c>.
    /// </summary>
    public static PilotRunDeltasResponse ToResponseWithProofPackage(
        ArchitectureRun run,
        GoldenManifest? manifest,
        PilotRunDeltas deltas,
        ValueReportSnapshot valueWindowSnapshot)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(valueWindowSnapshot);
        PilotBuyerSafeEvidenceGateResult gate =
            PilotBuyerSafeEvidenceGateEvaluator.Evaluate(run, manifest, deltas, valueWindowSnapshot);
        ProofPackageCompletenessResponse completeness =
            PilotProofPackageCompletenessMapper.Build(run, manifest, deltas, gate, valueWindowSnapshot);

        DateTime? extractorTs = null;
        if (manifest?.Metadata != null && manifest.Metadata.TryGetValue(ArchLucid.Application.AzureExtractor.AzureExtractorEvidenceBundleMerger.MetadataCollectionTimestampUtcKey, out string? tsStr))
        {
            if (DateTime.TryParse(tsStr, null, System.Globalization.DateTimeStyles.RoundtripKind, out DateTime parsed))
                extractorTs = parsed;
        }

        return MapCore(deltas, extractorTs, completeness);
    }

    private static PilotRunDeltasResponse MapCore(PilotRunDeltas deltas, DateTime? extractorCollectionTimestampUtc, ProofPackageCompletenessResponse? proofPackage)
    {
        return new PilotRunDeltasResponse
        {
            ExtractorCollectionTimestampUtc = extractorCollectionTimestampUtc,
            TimeToCommittedManifestTotalSeconds = deltas.TimeToCommittedManifest?.TotalSeconds,
            ManifestCommittedUtc = deltas.ManifestCommittedUtc,
            RunCreatedUtc = deltas.RunCreatedUtc,
            FindingsBySeverity = deltas.FindingsBySeverity.Select(p => new PilotRunDeltaSeverityCountResponse { Severity = p.Key, Count = p.Value }).ToList(),
            AuditRowCount = deltas.AuditRowCount,
            AuditRowCountTruncated = deltas.AuditRowCountTruncated,
            LlmCallCount = deltas.LlmCallCount,
            LlmCallCountResolved = deltas.LlmCallCountResolved,
            TopFindingSeverity = deltas.TopFindingSeverity,
            TopFindingId = deltas.TopFindingId,
            TopFindingEvidenceChain = deltas.TopFindingEvidenceChain,
            IsDemoTenant = deltas.IsDemoTenant,
            EstimatedUsdSavings = deltas.EstimatedUsdSavings,
            ProofPackageCompleteness = proofPackage,
        };
    }
}
