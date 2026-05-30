using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>Derives orphan-candidate KPIs from committed run agent findings (TB-103).</summary>
internal static class ExecutiveOrphanCandidateKpiCalculator
{
    internal static ExecutiveOrphanCandidateSummary BuildFromLatestDetails(IReadOnlyList<ArchitectureRunDetail> latestDetails)
    {
        ArgumentNullException.ThrowIfNull(latestDetails);

        ArchitectureRunDetail? evidence =
            latestDetails
                .Where(static d => d.IsCommitted)
                .OrderByDescending(static d => d.Manifest?.Metadata.CreatedUtc ?? d.Run.CompletedUtc ?? DateTime.MinValue)
                .FirstOrDefault();

        if (evidence is null)
            return new ExecutiveOrphanCandidateSummary { CandidateCount = 0 };

        List<ArchitectureFinding> orphans = OrphanCandidateFindingClassifier
            .DistinctByFindingId(
                evidence.Results
                    .SelectMany(static r => r.Findings)
                    .Where(OrphanCandidateFindingClassifier.IsOrphanCandidate))
            .ToList();

        decimal savingsSum = 0m;
        bool anySavings = false;

        foreach (ArchitectureFinding orphan in orphans)
        {
            if (orphan.EstimatedUsdSavings is not { } usd)
                continue;

            savingsSum += usd;
            anySavings = true;
        }

        return new ExecutiveOrphanCandidateSummary
        {
            CandidateCount = orphans.Count,
            AnnualSavingsUsd = anySavings ? savingsSum : null,
            EvidenceRunId = evidence.Run.RunId,
        };
    }
}
