using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Findings.FindingVerification;

/// <summary>TB-2034 deterministic ADR 0062 scoring rules (no LLM).</summary>
public sealed class FindingVerificationDeterministicScorer : IFindingVerificationScorer
{
    public (FindingVerificationStatus Status, string TraceText) Score(
        Finding sourceFinding,
        FindingVerificationScoringContext context)
    {
        ArgumentNullException.ThrowIfNull(sourceFinding);
        ArgumentNullException.ThrowIfNull(context);

        if (!context.VerificationFindingsSnapshotId.HasValue)
        {
            return (
                FindingVerificationStatus.NotVerifiable,
                "RV-001: no verification findings snapshot supplied");
        }

        if (context.VerificationSnapshot is null)
        {
            return (
                FindingVerificationStatus.NotVerifiable,
                $"RV-001: verification findings snapshot '{context.VerificationFindingsSnapshotId.Value:D}' was not resolved");
        }

        IReadOnlyList<string> evidenceRefs = sourceFinding.EvidenceRefs ?? [];

        if (!GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(evidenceRefs))
        {
            return (
                FindingVerificationStatus.NotVerifiable,
                "RV-002: finding lacks concrete evidence citations in the sealed package");
        }

        bool isMatched = context.Correlation.MatchedPairs.Any(pair =>
            string.Equals(pair.LeftFindingId, sourceFinding.FindingId, StringComparison.OrdinalIgnoreCase));

        if (isMatched)
        {
            FindingCorrelationPair? pair = context.Correlation.MatchedPairs.FirstOrDefault(candidate =>
                string.Equals(candidate.LeftFindingId, sourceFinding.FindingId, StringComparison.OrdinalIgnoreCase));

            string method = pair?.Method.ToString() ?? "Unknown";

            return (
                FindingVerificationStatus.Materialized,
                $"RV-003: correlated match in verification snapshot via {method}");
        }

        if (context.Dispositions.TryGetValue(sourceFinding.FindingId, out FindingDisposition disposition)
            && disposition == FindingDisposition.Remediated)
        {
            return (
                FindingVerificationStatus.Mitigated,
                "RV-004: finding dropped out of verification snapshot with Remediated disposition");
        }

        if (context.VerificationSnapshot.EngineFailures.Count > 0)
        {
            return (
                FindingVerificationStatus.NotVerifiable,
                "RV-005: verification snapshot has partial engine failures; evidence scope incomplete");
        }

        if (!EvidenceRefsCoveredByVerificationSnapshot(sourceFinding, context.VerificationSnapshot))
        {
            return (
                FindingVerificationStatus.NotVerifiable,
                "RV-005: cited evidence refs are outside verification snapshot coverage");
        }

        return (
            FindingVerificationStatus.NotObserved,
            "RV-005: finding absent from verification snapshot with no remediation disposition");
    }

    private static bool EvidenceRefsCoveredByVerificationSnapshot(
        Finding sourceFinding,
        FindingsSnapshot verificationSnapshot)
    {
        ArgumentNullException.ThrowIfNull(sourceFinding);
        ArgumentNullException.ThrowIfNull(verificationSnapshot);

        IReadOnlyList<string> citedRefs = sourceFinding.EvidenceRefs ?? [];

        if (citedRefs.Count == 0)
        {
            return true;
        }

        HashSet<string> verificationRefs = verificationSnapshot.Findings
            .SelectMany(finding => finding.EvidenceRefs ?? [])
            .Concat(verificationSnapshot.ChecklistCoverage.SelectMany(finding => finding.EvidenceRefs ?? []))
            .Where(static reference => !string.IsNullOrWhiteSpace(reference))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (string citedRef in citedRefs)
        {
            if (string.IsNullOrWhiteSpace(citedRef))
            {
                continue;
            }

            if (verificationRefs.Contains(citedRef))
            {
                continue;
            }

            return false;
        }

        return true;
    }
}
