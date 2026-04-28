using ArchLucid.Contracts.Explanation;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.AgentRuntime.Explanation;

/// <summary>
///     Builds citation chips for aggregate explanations from the same <see cref="RunDetailDto" /> used for
///     faithfulness checks.
/// </summary>
public static class RunExplanationCitationBuilder
{
    private const int MaxFindingCitations = 40;

    /// <summary>Produces stable citations for manifest-scoped runs; empty when no golden manifest.</summary>
    public static IReadOnlyList<CitationReference> Build(RunDetailDto detail)
    {
        if (detail.GoldenManifest is null)
            return [];


        ManifestDocument m = detail.GoldenManifest;
        Guid runId = m.RunId;
        List<CitationReference> list =
        [
            new(CitationKind.Manifest, m.ManifestId.ToString("D"), "Golden manifest", runId),
            new(CitationKind.DecisionTrace, m.DecisionTraceId.ToString("D"), "Decision trace", runId),
            new(CitationKind.ContextSnapshot, m.ContextSnapshotId.ToString("D"), "Context snapshot", runId),
            new(CitationKind.GraphSnapshot, m.GraphSnapshotId.ToString("D"), "Graph snapshot", runId)
        ];

        if (detail.FindingsSnapshot is { Findings.Count: > 0 } snap)
        {
            int take = Math.Min(snap.Findings.Count, MaxFindingCitations);

            for (int i = 0; i < take; i++)
            {
                Finding f = snap.Findings[i];
                string title = string.IsNullOrWhiteSpace(f.Title) ? f.FindingId : $"{f.FindingId}: {f.Title}";
                list.Add(new CitationReference(CitationKind.Finding, f.FindingId, title, runId));
            }
        }

        if (detail.ArtifactBundle is { } b)
            list.Add(new CitationReference(CitationKind.EvidenceBundle, b.BundleId.ToString("D"), "Artifact bundle",
                runId));

        return list;
    }
}
