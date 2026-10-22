using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Turns a cross-review correlation result into per-finding lifecycle records (TB-2194). Pure by design: the
///     correlation engine already decided identity, so this only decides what each match or non-match means and how
///     strongly it can be stated.
/// </summary>
public static class CrossReviewFindingLifecycleResolver
{
    public static IReadOnlyList<CrossReviewFindingLifecycleRecord> Resolve(
        IReadOnlyList<ArchitectureFinding> priorFindings,
        IReadOnlyList<ArchitectureFinding> currentFindings,
        CrossReviewFindingCorrelationResult correlation,
        IReadOnlyDictionary<string, FindingDisposition> latestPriorDispositions,
        CrossReviewFindingSourceCoverage sourceCoverage)
    {
        ArgumentNullException.ThrowIfNull(priorFindings);
        ArgumentNullException.ThrowIfNull(currentFindings);
        ArgumentNullException.ThrowIfNull(correlation);
        ArgumentNullException.ThrowIfNull(latestPriorDispositions);
        ArgumentNullException.ThrowIfNull(sourceCoverage);

        Dictionary<string, ArchitectureFinding> priorById = IndexByFindingId(priorFindings);
        Dictionary<string, ArchitectureFinding> currentById = IndexByFindingId(currentFindings);

        List<CrossReviewFindingLifecycleRecord> records = [];

        records.AddRange(BuildStillPresentRecords(correlation, currentById));
        records.AddRange(BuildNewlyIdentifiedRecords(correlation, currentById));
        records.AddRange(BuildCandidateResolvedRecords(correlation, priorById, latestPriorDispositions, sourceCoverage));

        return records
            .OrderBy(static record => record.State)
            .ThenByDescending(static record => record.Severity)
            .ThenBy(static record => record.CurrentFindingId ?? record.PriorFindingId, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static IEnumerable<CrossReviewFindingLifecycleRecord> BuildStillPresentRecords(
        CrossReviewFindingCorrelationResult correlation,
        IReadOnlyDictionary<string, ArchitectureFinding> currentById)
    {
        foreach (FindingCorrelationPair pair in correlation.MatchedPairs)
        {
            if (!currentById.TryGetValue(pair.RightFindingId, out ArchitectureFinding? current))
                continue;

            yield return new CrossReviewFindingLifecycleRecord
            {
                State = CrossReviewFindingLifecycleState.PreviouslyIdentifiedStillPresent,
                ResolutionBasis = CrossReviewFindingResolutionBasis.NotApplicable,
                PriorFindingId = pair.LeftFindingId,
                CurrentFindingId = pair.RightFindingId,
                CorrelationMethod = pair.Method,
                Severity = current.Severity,
                Category = current.Category,
                Message = current.Message,
                SourceAgent = current.SourceAgent,
            };
        }
    }

    private static IEnumerable<CrossReviewFindingLifecycleRecord> BuildNewlyIdentifiedRecords(
        CrossReviewFindingCorrelationResult correlation,
        IReadOnlyDictionary<string, ArchitectureFinding> currentById)
    {
        foreach (string findingId in correlation.UnmatchedRightFindingIds)
        {
            if (!currentById.TryGetValue(findingId, out ArchitectureFinding? current))
                continue;

            yield return new CrossReviewFindingLifecycleRecord
            {
                State = CrossReviewFindingLifecycleState.NewlyIdentified,
                ResolutionBasis = CrossReviewFindingResolutionBasis.NotApplicable,
                CurrentFindingId = findingId,
                CorrelationMethod = FindingCorrelationMethod.None,
                Severity = current.Severity,
                Category = current.Category,
                Message = current.Message,
                SourceAgent = current.SourceAgent,
            };
        }
    }

    private static IEnumerable<CrossReviewFindingLifecycleRecord> BuildCandidateResolvedRecords(
        CrossReviewFindingCorrelationResult correlation,
        IReadOnlyDictionary<string, ArchitectureFinding> priorById,
        IReadOnlyDictionary<string, FindingDisposition> latestPriorDispositions,
        CrossReviewFindingSourceCoverage sourceCoverage)
    {
        foreach (string findingId in correlation.UnmatchedLeftFindingIds)
        {
            if (!priorById.TryGetValue(findingId, out ArchitectureFinding? prior))
                continue;

            FindingDisposition? disposition =
                latestPriorDispositions.TryGetValue(findingId, out FindingDisposition resolved) ? resolved : null;

            yield return new CrossReviewFindingLifecycleRecord
            {
                State = CrossReviewFindingLifecycleState.CandidateResolved,
                ResolutionBasis = ResolveBasis(prior, disposition, sourceCoverage),
                PriorFindingId = findingId,
                CorrelationMethod = FindingCorrelationMethod.None,
                Severity = prior.Severity,
                Category = prior.Category,
                Message = prior.Message,
                SourceAgent = prior.SourceAgent,
                LatestDisposition = disposition,
            };
        }
    }

    /// <summary>
    ///     Coverage is checked first: when the producing analysis did not run again, the finding was not looked for, so
    ///     even a recorded remediation has lost its corroborating observation.
    /// </summary>
    private static CrossReviewFindingResolutionBasis ResolveBasis(
        ArchitectureFinding prior,
        FindingDisposition? latestDisposition,
        CrossReviewFindingSourceCoverage sourceCoverage)
    {
        if (!sourceCoverage.CoversInCurrent(prior.SourceAgent))
            return CrossReviewFindingResolutionBasis.AbsenceNotInformative;

        if (latestDisposition == FindingDisposition.Remediated)
            return CrossReviewFindingResolutionBasis.ConfirmedByDisposition;

        return CrossReviewFindingResolutionBasis.Unverified;
    }

    private static Dictionary<string, ArchitectureFinding> IndexByFindingId(
        IReadOnlyList<ArchitectureFinding> findings)
    {
        Dictionary<string, ArchitectureFinding> index = new(StringComparer.OrdinalIgnoreCase);

        foreach (ArchitectureFinding finding in findings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingId))
                continue;

            // Correlation dequeues one right-side finding per key, so first-wins matches how pairs were formed.
            index.TryAdd(finding.FindingId, finding);
        }

        return index;
    }
}
