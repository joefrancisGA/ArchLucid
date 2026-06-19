using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Classifies top-severity finding evidence sufficiency for sponsor-facing guard labels — not legal attestation.
/// </summary>
public enum TopFindingEvidenceSufficiency
{
    Sufficient,
    Low,
    Insufficient,
}

/// <summary>
///     Maps persisted proof pointers to a single sponsor-readable sufficiency class for the top finding excerpt.
/// </summary>
public static class TopFindingEvidenceSufficiencyClassifier
{
    public static TopFindingEvidenceSufficiency? Classify(
        PilotRunDeltas deltas,
        ProofPackageCompletenessResponse proof,
        ArchitectureRun run)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(proof);
        ArgumentNullException.ThrowIfNull(run);

        if (deltas.TopFindingId is null)
            return null;

        if (deltas.TopFindingEvidenceChain is null)
            return TopFindingEvidenceSufficiency.Insufficient;

        IReadOnlyList<string> labels = SponsorEvidenceBasisLabelResolver.ResolveLabels(proof, deltas, run);

        if (labels.Contains("Deferred scope", StringComparer.Ordinal)
            || labels.Contains("Demo-derived", StringComparer.Ordinal)
            || labels.Contains("Low support", StringComparer.Ordinal)
            || labels.Contains("Manual review required", StringComparer.Ordinal))
        {
            return TopFindingEvidenceSufficiency.Low;
        }

        if (!proof.AgentOutputPilotStrictEvidenceSatisfied)
            return TopFindingEvidenceSufficiency.Low;

        if (run.RealModeFellBackToSimulator)
            return TopFindingEvidenceSufficiency.Low;

        return TopFindingEvidenceSufficiency.Sufficient;
    }

    public static string DescribeForMarkdownTable(TopFindingEvidenceSufficiency? sufficiency)
    {
        if (sufficiency is null)
            return "_(not applicable — no top finding)_";

        return sufficiency switch
        {
            TopFindingEvidenceSufficiency.Sufficient =>
                "**Sufficient** — persisted evidence-chain pointers and proof checks support sponsor review; humans still approve.",
            TopFindingEvidenceSufficiency.Low =>
                "**Low** — treat narrative as directional; reconcile PilotStrict, simulator, or partial ROI posture before quoting as definitive.",
            TopFindingEvidenceSufficiency.Insufficient =>
                "**Insufficient** — top finding lacks resolvable evidence-chain pointers; do **not** present as evidence-backed.",
            _ => throw new InvalidOperationException($"Unhandled sufficiency: {sufficiency}"),
        };
    }

    public static string DescribeConfidenceClass(TopFindingEvidenceSufficiency? sufficiency)
    {
        if (sufficiency is null)
            return "N/A";

        return sufficiency switch
        {
            TopFindingEvidenceSufficiency.Sufficient => "sponsor-review-ready",
            TopFindingEvidenceSufficiency.Low => "manual-review-required",
            TopFindingEvidenceSufficiency.Insufficient => "not-evidence-backed",
            _ => throw new InvalidOperationException($"Unhandled sufficiency: {sufficiency}"),
        };
    }
}
