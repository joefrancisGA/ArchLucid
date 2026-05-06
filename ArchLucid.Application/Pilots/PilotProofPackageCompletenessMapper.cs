using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.ValueReports;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Maps persisted sponsor-facing slices into <see cref="ProofPackageCompletenessResponse"/> for JSON parity with the
///     Markdown checklist — booleans are explicit so absent SQL lookups surface as unresolved rather than invented counts.
/// </summary>
public static class PilotProofPackageCompletenessMapper
{
    /// <summary>Builds the completeness contract aligned with <see cref="PilotBuyerSafeEvidenceGateEvaluator"/>.</summary>
    public static ProofPackageCompletenessResponse Build(
        ArchitectureRun run,
        GoldenManifest? manifest,
        PilotRunDeltas deltas,
        PilotBuyerSafeEvidenceGateResult gate,
        ValueReportSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(gate);
        ArgumentNullException.ThrowIfNull(snapshot);

        bool manifestPresent = manifest is not null;
        PilotRoiEvidenceConfidence roiTier = PilotRoiEvidenceConfidenceResolver.Resolve(snapshot);

        return new ProofPackageCompletenessResponse
        {
            DemoTenantWarningRequired = deltas.IsDemoTenant,
            SupportRunIdPresent = !string.IsNullOrWhiteSpace(run.RunId),
            CommittedManifestPresent = manifestPresent,
            RunInCommittedStatus = run.Status == ArchitectureRunStatus.Committed,
            ArtifactDescriptorCount =
                deltas.SynthesizedArtifactDescriptorCountResolved ? deltas.SynthesizedArtifactDescriptorCount : null,
            ArtifactDescriptorCountResolved = deltas.SynthesizedArtifactDescriptorCountResolved,
            TimeToCommittedManifestResolved = deltas.TimeToCommittedManifest is not null,
            FindingsBySeverityPresent = deltas.FindingsBySeverity.Count > 0,
            TopFindingEvidenceChainPresentOrNotApplicable =
                deltas.TopFindingId is null || deltas.TopFindingEvidenceChain is not null,
            AuditRowsPresentOrLowerBound = deltas.AuditRowCount > 0 || deltas.AuditRowCountTruncated,
            LlmCallCount = deltas.LlmCallCount,
            LlmCallCountResolved = deltas.LlmCallCountResolved,
            RoiEvidenceConfidence = roiTier,
            RoiConfidenceLabel = PilotRoiEvidenceConfidenceResolver.FormatBaselineProvenanceLabel(
                snapshot.ReviewCycleBaselineProvenance),
            BuyerSafeRedactionProfile = ResolveBuyerSafeRedactionProfile(deltas.IsDemoTenant),
            PublishingTier = gate.PublishingTier.ToString(),
            ProofSendability = gate.ProofSendability.ToString(),
        };
    }

    /// <summary>
    ///     Demo runs need aggressive watermarking; production pilots still require manual prose redaction before external
    ///     circulation.
    /// </summary>
    public static string ResolveBuyerSafeRedactionProfile(bool isDemoTenant)
    {
        return isDemoTenant
            ? "Demo seed identifiers — full-page illustration watermark required; do not circulate raw metrics externally."
            : "Tenant-scoped operator export — redact customer-identifying prose before sponsor circulation.";
    }

}
