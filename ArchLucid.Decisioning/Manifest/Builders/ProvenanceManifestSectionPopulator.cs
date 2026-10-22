using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Decisioning.Manifest.Builders;

/// <summary>Populates manifest provenance and honesty warnings from snapshots and trace.</summary>
public sealed class ProvenanceManifestSectionPopulator
{
    public void Populate(
        ManifestDocument manifest,
        FindingsSnapshot findingsSnapshot,
        RuleAuditTracePayload trace)
    {
        manifest.Provenance.SourceFindingIds = findingsSnapshot.Findings
            .Select(f => f.FindingId)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Provenance.SourceGraphNodeIds = findingsSnapshot.Findings
            .SelectMany(f => f.RelatedNodeIds)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        manifest.Provenance.AppliedRuleIds = trace.AppliedRuleIds
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        AppendManifestHonestyWarnings(manifest, findingsSnapshot);
    }

    private static void AppendManifestHonestyWarnings(ManifestDocument manifest, FindingsSnapshot findingsSnapshot)
    {
        if (findingsSnapshot.EvaluationConfidenceEnrichmentSkipped)

            manifest.Warnings.Add(
                "Evaluation confidence enrichment was skipped for this host profile; finding evaluation scores may be absent.");

        if (findingsSnapshot.EngineFailures.Count == 0)
            return;

        manifest.Warnings.Add(
            "Degraded finding coverage: one or more finding engines failed during snapshot generation; review findings may be incomplete.");

        manifest.Warnings.Add(
            $"Finding engines: {findingsSnapshot.EngineFailures.Count} failed during snapshot generation; findings may be incomplete.");

        foreach (FindingEngineFailure failure in findingsSnapshot.EngineFailures)

            manifest.Warnings.Add(
                $"Finding engine failure [{failure.EngineType}/{failure.Category}]: {failure.ExceptionType} — {failure.ErrorMessage}");
    }
}
